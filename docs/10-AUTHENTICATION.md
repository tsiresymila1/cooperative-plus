# Authentification

## Méthodes par application

| Application | Méthodes |
|---|---|
| Client web | Google, email + code |
| Mobile | Google via Nitro Google Sign-In, email + code |
| Coop | Email + mot de passe uniquement |
| Admin | Email + mot de passe ou code email |

Toutes les méthodes aboutissent à une session InstantDB. Un même email doit
donc conserver le même utilisateur, ses réservations et ses adhésions.

## Configuration Google

### 1. Google Cloud

Créer dans le même projet Google Cloud :

- un client OAuth **Web application**, utilisé pour générer l'ID token ;
- un client OAuth **Android**, associé au package
  `ts.mila.cooperativeplus` et au SHA-1 du certificat qui signe l'application.

Pour le client web, configurer :

- les origines JavaScript du client web, notamment `http://localhost:4000` en
  développement et le domaine de production ;
- l’URI de redirection InstantDB
  `https://api.instantdb.com/runtime/oauth/callback`.

Conserver le Client ID et le Client Secret. Le Client ID est public ; le secret
ne doit jamais être ajouté aux variables `NEXT_PUBLIC_*` ou `EXPO_PUBLIC_*`.

### 2. InstantDB

Dans **Auth → Google**, enregistrer le client OAuth web pour les deux clients
InstantDB `google-web` et `google-android`, puis ajouter les origines de
redirection du client web.

- les domaines du client web.

### 3. Variables d’environnement

Client web :

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="<google-web-client-id>"
NEXT_PUBLIC_INSTANT_GOOGLE_CLIENT_NAME="google-web"
```

Mobile :

```env
EXPO_PUBLIC_INSTANT_GOOGLE_CLIENT_NAME="google-android"
EXPO_PUBLIC_GOOGLE_CLIENT_ID="<google-web-client-id>"
```

Le bouton Google web reste masqué tant que `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
n’est pas défini. Le flux mobile nécessite un development build natif : Expo
Go et Metro seuls ne contiennent pas le module Nitro.

## Vérification manuelle

1. Créer un utilisateur avec email + code et effectuer une réservation.
2. Se déconnecter puis utiliser Google avec le même email.
3. Vérifier que l’identifiant utilisateur et la réservation sont inchangés.
4. Répéter sur le client web et sur un build mobile.
5. Vérifier qu’un utilisateur sans adhésion ne peut pas accéder à Coop.
