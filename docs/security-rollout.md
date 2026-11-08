# Déploiement des correctifs de sécurité

Ces changements modifient ensemble le schéma, les permissions, les API et les
applications. Ne pas publier les règles seules : les versions mobiles précédentes
écrivent directement les réservations et ne peuvent plus le faire avec ces règles.

## Ordre de préparation

1. Sauvegarder les données et répéter le déploiement sur une application InstantDB
   de test. Vérifier les règles CEL avec des sessions voyageur, propriétaire,
   assistant limité et assistant désactivé, y compris un utilisateur membre de deux
   coopératives. Les tests unitaires ne remplacent pas cette vérification.
2. Pousser le schéma additif : `pnpm db:push-schema`. Vérifier la destination avant
   exécution : le script racine contient l'identifiant de la base de production.
3. Préparer les droits existants :
   `pnpm --filter @cp/instant migrate-membership-access` pour le diagnostic, puis
   `pnpm --filter @cp/instant migrate-membership-access --apply` pour l'application.
   Le script utilise le fichier `.env` racine. Il ne modifie que `memberships.access`.
4. Préparer les déploiements des trois applications web et le nouveau build Android.
   Vérifier `CRON_SECRET`, les clés PAPI et les URL publiques de chaque application.
   La limitation de fréquence utilise l'adresse fournie par Vercel ; adapter cette
   source au proxy de confiance avant un hébergement ailleurs.
5. Pendant une fenêtre de maintenance des réservations, déployer les applications,
   pousser les permissions et distribuer le build mobile. Les anciens clients
   doivent être mis à jour : aucun accès non authentifié de compatibilité n'est
   conservé sur l'initialisation du paiement.

## Vérifications avant réouverture

- Deux utilisateurs tentent le même siège : une seule acquisition réussit.
- Une requête modifiée ne change ni le tarif, ni le départ, ni les places attribuées.
- Un voyageur ne peut pas modifier les paiements, billets ou blocages d'un autre.
- Un assistant désactivé n'a plus accès ; les permissions d'une coopérative ne
  donnent aucun droit dans une autre.
- Une nouvelle tentative PAPI et une notification répétée sont rapprochées du bon
  paiement. La référence marchand est conservée après confirmation.
- Un paiement confirmé après annulation ou conflit est conservé en base ; la
  réservation passe à `payment_review` pour traitement par la coopérative.
- Les justificatifs privés ne sont pas consultables par un autre utilisateur.
- La tâche d'abonnement refuse les appels sans secret et nettoie les anciens
  compteurs de fréquence.

## Limites opérationnelles

Le remboursement d'un paiement en conflit reste manuel : aucun remboursement PAPI
automatique n'a été ajouté. Les anciennes réservations sans métadonnées serveur et
sans billet doivent être vérifiées ou recréées avant un nouveau paiement en ligne.
Les anciennes URL de stockage déjà partagées peuvent nécessiter une révocation ou
une rotation ; changer une règle de lecture ne retire pas une copie déjà obtenue.

Ne pas rétablir les anciennes permissions pour contourner un problème de client :
maintenir la fermeture des réservations et corriger le déploiement concerné.
