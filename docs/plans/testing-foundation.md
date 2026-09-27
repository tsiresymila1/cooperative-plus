# Fondation de tests — Cooperative Plus

## Objectif

Installer une pyramide de tests fiable pour le monorepo sans connecter les tests automatiques aux comptes, aux paiements ni aux données de production :

1. tests unitaires rapides avec Vitest pour les règles pures et les adaptateurs locaux ;
2. tests d'intégration Vitest pour les routes Hono et leurs contrats HTTP, avec les services externes simulés ;
3. smoke tests Playwright pour les trois applications web (`client`, `coop`, `admin`) ;
4. parcours Android Maestro sur un émulateur Pixel 6 ;
5. gates et CI séparés pour qu'un échec indique immédiatement la couche concernée.

Le premier lot vise une fondation déterministe et extensible. Les parcours authentifiés complets et les paiements réels sont explicitement hors du gate de pull request tant qu'un tenant InstantDB de test et des comptes de test dédiés ne sont pas provisionnés.

## État actuel constaté

- La racine est un workspace pnpm/Turborepo (`package.json`, `pnpm-workspace.yaml`, `turbo.json`) sous Node `>=22`, mais ne déclare aucun script `test` et aucune dépendance Vitest, Playwright ou Maestro.
- Les quatre applications ont uniquement des scripts de build/typecheck ; `apps/mobile/package.json` n'a pas de runner de test.
- Le seul contrôle exécutable assimilable à un test est `packages/instant/src/subscription.check.ts`, un script `node:assert` manuel. Il couvre partiellement `dueStatus`, `nextPeriodEnd` et `atLimit`, mais n'est appelé par aucun gate.
- Les règles pures les plus rentables à tester sont déjà isolées :
  - schémas Zod dans `packages/validation/src/index.ts` ;
  - AES-256-GCM dans `packages/crypto/src/index.ts` ;
  - scrypt dans `packages/instant/src/password.ts` ;
  - cycle d'abonnement dans `packages/instant/src/subscription.ts` ;
  - sièges, dates, références et statuts dans `apps/mobile/src/lib/domain.ts` ;
  - client PAPI mobile dans `apps/mobile/src/lib/payment.ts`.
- Les API web utilisent Hono avec une frontière claire contrôleur → service → route :
  - paiement client dans `apps/client/src/lib/http/**` ;
  - authentification, récupération de mot de passe, équipe, secrets et abonnements dans `apps/coop/src/lib/http/**` ;
  - authentification et coopératives dans `apps/admin/src/lib/http/**`.
- Les trois routers traduisent `HttpError` en `{ error: string }` et les validateurs JSON répondent `400`, ce qui offre un contrat HTTP testable via `app.request()` sans démarrer Next.js.
- Les services importent actuellement `adminDb` statiquement depuis `@cp/instant/admin`. Les tests de service devront mocker ce module avant l'import ou recevoir un petit adaptateur injecté ; ils ne doivent jamais charger un vrai `INSTANT_ADMIN_TOKEN`.
- Les ports de développement réels sont 4000, 4001 et 4002 dans les `package.json` des apps (la mention 3000/3001 du README est obsolète).
- Le client expose des pages publiques stables (`/privacy`, `/terms`, `/faq`, `/about`, `/sign-in`). L'espace coop affiche `SignInScreen` à `/` pour un visiteur ; l'admin affiche le même composant via `AdminGuard` à `/admin/dashboard`.
- `SignInScreen` contient les parcours mot de passe, affichage/masquage et mot de passe oublié (`packages/ui/src/components/sign-in.tsx`). L'app mobile utilise `KeyboardAvoidingView` + `ScrollView`, affiche « Continuer avec Google », valide localement l'email et passe au code à six chiffres (`apps/mobile/app/sign-in.tsx`).
- L'app Android a l'identifiant `ts.mila.cooperativeplus` (`apps/mobile/app.json`) et un onboarding local piloté par AsyncStorage (`apps/mobile/app/onboarding.tsx`). Ces deux écrans permettent des smoke tests sans compte.
- La seule CI existante, `.github/workflows/android-build.yml`, construit et publie Android ; elle ne valide ni les types web, ni les tests, ni l'E2E.

## Choix d'architecture de test

### Vitest centralisé à la racine

Utiliser une configuration racine pour éviter de dupliquer une configuration dans chaque workspace :

- `vitest.config.ts` : environnement Node, fichiers `**/*.test.ts`, tests unitaires ;
- `vitest.integration.config.ts` : environnement Node, fichiers `**/*.integration.test.ts`, timeout légèrement supérieur ;
- `@vitest/coverage-v8` : couverture limitée initialement aux modules effectivement placés sous test, avec un seuil de 80 % lignes/fonctions/branches/statements pour ce périmètre. Étendre le périmètre puis relever le seuil, ne jamais le diminuer pour faire passer un gate.

Les tests restent colocalisés avec leur module. Les imports relatifs rendent les tests unitaires indépendants des alias Next/Expo ; les packages workspace restent résolus par pnpm.

Scripts racine visés :

```json
{
  "test": "pnpm test:unit && pnpm test:integration",
  "test:unit": "vitest run --config vitest.config.ts",
  "test:integration": "vitest run --config vitest.integration.config.ts",
  "test:coverage": "vitest run --config vitest.config.ts --coverage",
  "test:e2e": "playwright test",
  "test:mobile": "maestro test apps/mobile/.maestro"
}
```

Ne pas placer Playwright ou Maestro sous `pnpm test` : le gate local rapide doit rester inférieur à quelques minutes et ne pas exiger de navigateur, d'émulateur ou de secret.

### Tests d'intégration Hono sans serveur ni base réelle

Tester les routers avec l'API native `app.request()` de Hono. Les tests montent le vrai validateur, le vrai contrôleur, les vraies routes et le vrai gestionnaire d'erreurs, puis remplacent uniquement la frontière service/InstantDB.

Ordre recommandé :

1. contrats de validation et erreurs pour `POST /api/auth/password`, `/password/forgot`, `/password/reset` et `/api/payment/initiate` ;
2. succès contrôleur avec service mocké ;
3. services d'authentification avec un faux `adminDb` en mémoire : normalisation de l'email, compte inconnu, mauvais mot de passe, non-divulgation lors du reset, code expiré, mise à jour du hash ;
4. paiement : réservation absente/déjà payée, PAPI non configuré, réponse fournisseur invalide, webhook idempotent et rejet d'un `notificationToken` incorrect.

Si les mocks de `adminDb.tx` deviennent illisibles, extraire un adaptateur étroit (`queryCredential`, `createToken`, `sendMagicCode`, `checkMagicCode`, `updatePassword`) et l'injecter dans le service. Ne pas créer une fausse base générique ni modifier le comportement public.

### Playwright multi-app

Créer un `playwright.config.ts` racine avec trois projets et trois `webServer` :

| Projet | Base URL | Commande |
|---|---:|---|
| `client` | `http://127.0.0.1:4000` | `pnpm --filter @cp/client dev` |
| `coop` | `http://127.0.0.1:4001` | `pnpm --filter @cp/coop dev` |
| `admin` | `http://127.0.0.1:4002` | `pnpm --filter @cp/admin dev` |

Premier périmètre, sans compte de production :

- client : ouverture de `/privacy`, `/terms`, `/faq`, vérification des titres/liens et absence d'erreur de page ;
- client : `/sign-in`, champ email, bouton d'envoi et bouton Google quand les variables publiques de test sont présentes ;
- coop : écran non authentifié, champs email/mot de passe, toggle accessible « Afficher/Masquer le mot de passe », passage vers « Mot de passe oublié » puis retour sans soumettre ;
- admin : `/admin/dashboard` affiche le shell d'authentification pour un visiteur et protège le contenu privé ;
- chaque app : une réponse 404 personnalisée et aucun `pageerror`/échec de requête document.

Les tests doivent privilégier `getByRole`, `getByLabel` et le texte accessible. Ajouter `data-testid` uniquement quand aucun rôle stable n'existe. Les traces Playwright sont conservées au premier retry et les captures uniquement sur échec.

Les écrans coop/admin interrogent l'état auth InstantDB même sans utilisateur. La CI doit donc employer un `NEXT_PUBLIC_INSTANT_APP_ID` d'un tenant de test, jamais celui de production. Ce premier lot ne possède aucun compte et n'effectue aucune mutation. Si ce tenant n'est pas disponible au moment de l'implémentation, garder client public dans le gate obligatoire et classer les smoke tests coop/admin `needs-verification` plutôt que d'utiliser l'ID de production.

### Maestro Android

Stocker les flows sous `apps/mobile/.maestro/` et utiliser l'appId `ts.mila.cooperativeplus`. Les flows initiaux sont indépendants d'un compte :

1. `onboarding.yaml` : `clearState`, lancement, vérification de la première slide, « Passer », arrivée sur « Accueil » ;
2. `sign-in.yaml` : `clearState`, passer l'onboarding, onglet « Profil », « Se connecter », vérifier « Continuer avec Google », saisir un email invalide et vérifier « Adresse email invalide » ;
3. `keyboard-sign-in.yaml` : sur profil Pixel 6, ouvrir le clavier dans le champ email et vérifier que « Envoyer le code » reste visible et pressable ;
4. `theme-smoke.yaml` : basculer le thème depuis « Profil » et vérifier que l'app reste navigable (sans snapshot couleur fragile).

Ajouter des identifiants stables aux contrôles critiques, par exemple `onboarding-skip`, `profile-sign-in`, `sign-in-google`, `sign-in-email`, `sign-in-send-code` et `sign-in-error`. Conserver les libellés accessibles pour les utilisateurs ; les `testID` ne doivent pas remplacer l'accessibilité.

Pour CI, construire un APK release de test autonome (`apps/mobile/android/gradlew :app:assembleRelease`) afin de ne pas dépendre de Metro, l'installer sur un émulateur Android API 35 profil Pixel 6, puis lancer Maestro. Utiliser une app InstantDB de test publique dans le bundle ; aucun `INSTANT_ADMIN_TOKEN`, compte Google ni code email n'est requis pour ces flows.

## Catalogue initial des tests unitaires

### `packages/validation/src/index.test.ts`

- valeurs par défaut/coercition de `searchTripsSchema` (`passengers`, `limit`, `sort`) ;
- UUID/date invalides, passagers hors de 1–20, limite hors de 1–50, prix négatif ;
- réservation valide et erreurs de contact/passager/holds ;
- paiements et remboursements, montant entier non négatif ;
- plan de sièges et véhicule, bornes rows/cols et statuts ;
- route/trip, heure `HH:mm`, dates et récurrence ;
- slug/email/plan de `createCooperativeSchema`.

### `packages/crypto/src/index.test.ts`

- round-trip Unicode et chaîne vide ;
- IV aléatoire : deux chiffrements du même texte diffèrent ;
- clé absente, clé non hexadécimale ou longueur incorrecte ;
- format tronqué et auth tag/ciphertext corrompus ;
- `isEncrypted` vrai/faux, sans lui demander de garantir l'intégrité cryptographique.

Chaque test utilise `vi.stubEnv`/`vi.unstubAllEnvs` ; aucune édition de `.env`.

### `packages/instant/src/password.test.ts`

- hash salé différent pour le même mot de passe ;
- vérification correcte, mauvais mot de passe et format incomplet ;
- hash vide/corrompu renvoie `false` sans fuite de secret.

### `packages/instant/src/subscription.test.ts`

- migrer et étendre tous les cas de `subscription.check.ts`, puis supprimer le script redondant ;
- statuts utilisables/suspendus ;
- quotas illimités, juste sous/au-dessus de la limite ;
- trial, grace period, renouvellement et états terminaux avec horloge fixe ;
- ajout d'un mois/d'une année, y compris une date de fin de mois documentée.

### `apps/mobile/src/lib/domain.test.ts`

- snapshot direct, objet `{ layout }`, JSON string et fallback invalide ;
- layout de 0, 1, 4 et plus de 4 sièges, driver/aisle, comptage et labels ;
- clés de siège, date locale, date/heure invalides, countdown négatif ;
- libellés/tons de tous les statuts réservation ;
- référence/QR avec `Math.random` et `Date.now` figés pour une preuve reproductible.

### `apps/mobile/src/lib/payment.test.ts`

- URL, méthode, headers et payload de `initiatePapi` ;
- succès, HTTP non-2xx, JSON invalide et absence d'URL ;
- `openPapi` renvoie `success`, `failed` ou `dismiss` à partir d'un mock `expo-web-browser` ;
- `EXPO_PUBLIC_API_URL` fixé avant import via `vi.resetModules`, puis nettoyé après chaque test.

## Frontières de données déterministes

- **Interdit dans les tests automatiques** : URL de production, `INSTANT_ADMIN_TOKEN` de production, compte Google personnel, boite email réelle, clé PAPI réelle, paiement réel, webhook réel.
- **Vitest** : tout appel InstantDB, `fetch`, `expo-web-browser`, horloge et hasard est injecté ou mocké. Restaurer mocks, timers et variables d'environnement après chaque test.
- **Playwright public** : tenant InstantDB dédié au test uniquement pour initialiser le SDK ; pas de compte, pas de seed, pas d'écriture. Les tests doivent fonctionner en parallèle et dans n'importe quel ordre.
- **Futurs E2E authentifiés** : tenant InstantDB dédié, seed idempotent avec un namespace `e2e-${GITHUB_RUN_ID}`, comptes dédiés par rôle, nettoyage dans `globalTeardown`. Aucun test ne purge des données qui ne portent pas son namespace.
- **Maestro initial** : `clearState` au début de chaque flow, pas de sélection de compte Google, pas d'envoi de magic code. La sélection réelle du compte et le round-trip email appartiennent à une suite staging manuelle/sécurisée.
- **Paiement** : la PR CI couvre les contrats avec faux PAPI. Un smoke staging peut utiliser `PAPI_TEST_MODE=true`, mais reste hors du gate rapide et ne reçoit jamais une clé production.

## Découpage d'implémentation et gates

### T1 — Runner et scripts Vitest

Ajouter les dépendances/configurations/scripts racine et un test sentinelle sur un vrai module (pas un test tautologique).

Gate :

```bash
pnpm test:unit && pnpm typecheck
```

### T2 — Couverture des domaines purs

Ajouter les tests validation, crypto, password, subscription et domaine mobile ; convertir `subscription.check.ts` en vraie suite Vitest.

Gate :

```bash
pnpm test:unit && pnpm test:coverage
```

### T3 — Paiement mobile et intégrations Hono

Ajouter les mocks de frontières, les tests du client PAPI mobile et les contrats HTTP client/coop/admin. Extraire seulement les adaptateurs minimaux nécessaires si les imports statiques empêchent un test lisible.

Gate :

```bash
pnpm test:unit && pnpm test:integration && pnpm typecheck
```

### T4 — Playwright trois applications

Ajouter la configuration, les smoke tests sans compte et les sélecteurs accessibles manquants. Les trois serveurs doivent être arrêtés automatiquement par Playwright.

Gate :

```bash
pnpm exec playwright install chromium && pnpm test:e2e
```

Le téléchargement du navigateur est une étape de préparation CI ; après installation, le gate de vérification normal est uniquement `pnpm test:e2e`.

### T5 — Maestro Android Pixel 6

Ajouter les identifiants stables et les quatre flows. Le gate local suppose qu'un émulateur Pixel 6 est démarré et que l'APK de test est installé.

Gate :

```bash
maestro test apps/mobile/.maestro
```

Gate CI complet :

```bash
cd apps/mobile/android && ./gradlew :app:assembleRelease --no-daemon && adb install -r app/build/outputs/apk/release/app-release.apk && cd ../../.. && maestro test apps/mobile/.maestro
```

### T6 — CI et documentation durable

Ajouter `.github/workflows/test.yml` et documenter les commandes. Ne pas mélanger la publication Play Store existante avec les tests de PR.

Gate :

```bash
pnpm install --frozen-lockfile && pnpm typecheck && pnpm test && pnpm test:e2e
```

Le job Maestro a son propre gate car il nécessite KVM/émulateur et peut être déclenché sur PR ciblée, `workflow_dispatch` et branche principale. Une fois sa stabilité démontrée, le rendre obligatoire avant release Android.

## CI cible

`test.yml` doit contenir trois jobs :

1. **unit-integration** — checkout, pnpm 9.12, Node 22, install frozen, `pnpm typecheck`, `pnpm test`, couverture ;
2. **web-e2e** — install frozen, cache Playwright, installation Chromium, `pnpm test:e2e`, upload de `playwright-report` et `test-results` uniquement en cas d'échec ;
3. **android-maestro** — Java 17, Android emulator runner avec API 35/profil `pixel_6`, build/install APK release, Maestro, upload des captures/logs en cas d'échec.

Limiter la concurrence par branche et annuler les runs précédents d'une même PR. Donner seulement `contents: read`. Les variables publiques du tenant test peuvent être des variables de repository ; tout token admin futur reste un secret scoped à l'environnement de test.

## Ce qui est immédiatement testable sans compte de production

- l'ensemble des tests unitaires listés ;
- toutes les validations et contrats HTTP en mockant les services ;
- toutes les erreurs/branches du paiement mobile avec `fetch` et navigateur simulés ;
- les pages éditoriales du client et les interactions locales des formulaires ;
- les écrans de connexion coop/admin en visiteur avec un app ID de test public ;
- onboarding, navigation, présence de Google Sign-In, validation locale de l'email et comportement clavier sur Android.

Ne sont pas immédiatement automatisables de manière honnête : réception d'un vrai code email, sélection d'un compte Google, autorisations par rôle, données de dashboard, réservation réelle et confirmation PAPI. Ces scénarios deviennent une seconde vague après provisionnement du tenant et des identités de test ; ils ne doivent pas être simulés comme « E2E » ni exécutés contre la production.

## Critères de réussite de la fondation

- `pnpm test` est vert hors ligne après installation des dépendances.
- Aucun test Vitest n'accède au réseau ; un appel non mocké fait échouer le test.
- Playwright couvre au moins un smoke test dans chacun des trois projets web sans compte production.
- Maestro passe les flows initiaux sur un Pixel 6/API 35 après `clearState`.
- Les erreurs produisent des artifacts exploitables, les succès n'encombrent pas la CI.
- La CI utilise Node 22 conformément à `package.json` et ne lit aucun secret de production.
- Les nouveaux tests sont stables sur deux exécutions consécutives et ne dépendent ni de l'ordre ni de l'heure réelle.
