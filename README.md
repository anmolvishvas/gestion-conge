# Gestion des Congés - SYDEV

## Prérequis

Avant de commencer, vous devez installer les outils suivants :

### 1. XAMPP
- Téléchargez XAMPP depuis : https://www.apachefriends.org/download.html
- Choisissez la version compatible avec votre système d'exploitation
- Installez en suivant les instructions du programme d'installation

### 2. Composer
- Téléchargez Composer depuis : https://getcomposer.org/download/
- Exécutez l'installateur et suivez les instructions

### 3. Scoop (Gestionnaire de paquets pour Windows)
- Ouvrez PowerShell en tant qu'administrateur
- Exécutez la commande suivante :
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

### 4. Symfony CLI
- Après avoir installé Scoop, installez Symfony CLI avec la commande :
```powershell
scoop install symfony-cli
```

## Installation du Projet

### Backend (Symfony)

1. Clonez le projet dans le répertoire htdocs de XAMPP :
```bash
cd C:/xampp/htdocs
git clone https://github.com/anmolvishvas/gestion-conge.git
cd gestion-conge-sydev
```

2. Installez les dépendances PHP :
```bash
composer install
```

3. Configurez le fichier .env.local :
- Ajouter l'apiKey du mail sengrid

4. Créez la base de données et effectuez les migrations :
```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
```

5. Lancez le serveur Symfony :
```bash
symfony server:start
```

6. Pour recevoir les mails en local, ouvrez un nouveau terminal et exécutez :
```bash
php bin/console messenger:consume async
```

### Frontend (React)

1. Installez Node.js si ce n'est pas déjà fait :
- Téléchargez depuis : https://nodejs.org/

2. Accédez au dossier frontend :
```bash
cd frontend
```

3. Installez les dépendances :
```bash
npm install
```

4. Lancez le serveur de développement :
```bash
npm run dev
```

## Accès à l'Application

- Backend : http://localhost:8000
- Frontend : http://localhost:5173
- PHPMyAdmin : http://localhost/phpmyadmin

## Structure du Projet

```
gestion-conge-sydev/
├── backend/          # Code Symfony
│   ├── src/
│   ├── config/
│   └── ...
├── frontend/         # Code frontend
│   ├── src/
│   ├── public/
│   └── ...
└── README.md
```

## Contribution

1. Créez une nouvelle branche pour vos modifications
2. Committez vos changements
3. Poussez vers la branche
4. Créez une Pull Request

## Support

Pour toute question ou problème, veuillez ouvrir une issue dans le repository du projet. 