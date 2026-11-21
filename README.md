# Pépètes 2.0

Ton budget, trois secondes par dépense. Une app web installable sur iPhone, sans serveur ni compte :
tes données restent sur ton téléphone.

## Ce qui change dans la 2.0

- Plus de budget global à respecter. L'Accueil montre ce que tu as gagné, dépensé et épargné dans le mois,
  une estimation de fin de mois, une comparaison avec tes mois habituels et ton épargne totale depuis ta
  première saisie. Les rentrées imprévues (prime, vente) comptent. Les budgets par catégorie restent en option.
- Nouvelle palette Indigo : indigo pour les actions, abricot pour les pièces, le niveau et les paliers,
  en clair comme en sombre. Les couleurs de tes catégories et étiquettes passent aux nouvelles teintes.
- Nouveau design sur tous les écrans : police Archivo, icônes dessinées à la place des émojis,
  accueil réorganisé, Opérations et Stats repensées.
- Optimisée pour l'iPhone 17 Pro :
  - retours haptiques (iOS 18 ou plus récent) ;
  - écran de lancement clair ou sombre, sans éclair blanc au démarrage ;
  - barre d'état assortie à l'écran affiché ;
  - le contenu défile jusqu'en bas de l'écran ;
  - les champs restent visibles au-dessus du clavier ;
  - pas de zoom accidentel quand tu tapes vite ;
  - prise en compte du réglage « Augmenter le contraste ».
- Plus économe en batterie : les animations d'ambiance s'arrêtent d'elles-mêmes, les bulles se figent
  quand elles ne bougent plus, et l'app tourne plus vite avec beaucoup d'opérations.

## Mettre à jour une installation existante

1. Sur GitHub, ouvre ton dépôt et supprime les anciens fichiers.
2. Clique « Add file », puis « Upload files ».
3. Glisse tout le contenu de ce dossier et valide (« Commit changes »).
4. Attends une minute, puis ouvre Pépètes sur ton iPhone. Le bandeau « Nouvelle version de Pépètes
   disponible » apparaît : touche « Mettre à jour ». Tes données sont conservées.

L'icône et l'écran de lancement sont mémorisés par iOS au moment où tu ajoutes l'app à l'écran
d'accueil. Pour les voir, il faut supprimer l'app puis la remettre. Supprimer l'app efface aussi ses données.
Fais donc d'abord une sauvegarde (Réglages, puis « Sauvegarder mes données »), et restaure-la ensuite avec
« Restaurer ». Sans réinstallation, tout le reste de la 2.0 fonctionne quand même.

## Première installation

1. Crée un compte sur github.com. C'est gratuit.
2. Crée un dépôt public nommé par exemple `pepetes`.
3. Envoie tous les fichiers de ce dossier avec « Add file », puis « Upload files ».
4. Va dans Settings, puis Pages. Choisis la branche `main`, le dossier `/ (root)`, puis Save.
5. Une minute plus tard, l'adresse `https://ton-pseudo.github.io/pepetes/` est active.
6. Ouvre-la dans Safari sur l'iPhone. Touche Partager, puis « Sur l'écran d'accueil ».

L'hébergement GitHub Pages est gratuit et permanent. L'app marche ensuite hors connexion.

## Contenu

- `index.html`, `app.css`, `app.js` : l'application.
- `sw.js` : le service worker, qui permet le hors ligne et les mises à jour.
- `manifest.webmanifest`, `icon-*.png` : l'installation sur l'écran d'accueil.
- `splash-*.png` : les écrans de lancement des iPhone récents, en clair et en sombre.
- `OFL.txt` : la licence de la police Archivo (SIL Open Font License 1.1), embarquée dans `app.css`.
