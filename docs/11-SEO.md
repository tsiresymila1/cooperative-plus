# Référencement du site client

## Domaine canonique

Le domaine public de référence est `https://www.coop-plus.site`. Toutes les
URLs canoniques, les cartes sociales et le sitemap doivent conserver ce domaine,
y compris le sous-domaine `www`.

## Pages indexables

- `/`
- `/search` — les variantes avec paramètres pointent vers cette URL canonique
- `/about`
- `/faq`
- `/coop/request`
- `/privacy`
- `/terms`
- `/data-deletion`

Les espaces de connexion et de compte, les réservations identifiées, les pages
de paiement et les trajets éphémères portent une directive `noindex`. Ne pas les
ajouter au sitemap.

## Google Search Console

1. Créer une propriété de domaine pour `coop-plus.site` et valider le DNS.
2. Ajouter la valeur de la balise HTML fournie par Google dans la variable
   `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` du projet Vercel client.
3. Redéployer le client.
4. Soumettre `https://www.coop-plus.site/sitemap.xml`.
5. Inspecter l’URL de la page d’accueil puis demander son indexation.

## Contrôles après chaque déploiement

- `https://www.coop-plus.site/robots.txt` répond en `200` et référence le sitemap.
- `https://www.coop-plus.site/sitemap.xml` ne contient que des URLs canoniques.
- La source HTML des pages publiques contient un titre, une description, une
  canonical, Open Graph et Twitter Card.
- `/sign-in`, `/account/dashboard`, `/bookings/...` et `/trips/...` contiennent
  `noindex`.
- Les données structurées passent le test Google Rich Results et le validateur
  Schema.org.

## Prochaine étape éditoriale

Créer des pages pérennes, rendues côté serveur, pour les destinations et les
liaisons importantes. Chaque page doit apporter un contenu unique : description
de la liaison, durée indicative, points de départ, conseils de voyage, FAQ et
liens vers la recherche. Ne pas générer des centaines de pages minces à partir
des seuls résultats dynamiques.
