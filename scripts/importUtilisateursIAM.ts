import KcAdminClient from '@keycloak/keycloak-admin-client';

// TODO
// [x] installer le client keycloak
// [ ] créer le client keycloak sur dev-keycloak
// [ ] faire un get sur l'api keycloak
// [ ] type: module = c'est quoi les conséquences ? on garde ? on jette ?
// [ ] faire un post pour créer un utilisateurs
// [ ] pouvoir lire les données dans un csv (quelle lib ?)
// [ ] quel format csv ?
// [ ] faire le ou les posts pour créer les utilisateurs
// [ ] comment on structure ça dans du code serveur admin ?
// [ ] changer de devDependencies en dependencies pour le client kc

const kcAdminClient = new KcAdminClient();
console.log(kcAdminClient);

// To configure the client, pass an object to override any of these  options:
// {
//   baseUrl: 'http://127.0.0.1:8080',
//   realmName: 'master',
//   requestOptions: {
//     /* Fetch request options https://developer.mozilla.org/en-US/docs/Web/API/fetch#options */
//   },
// }
