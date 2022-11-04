const Sauce = require('../models/Sauce');
const fs = require('fs'); // file system = donne accès aux fonctions qui permettent de modifier le systeme de fichiers

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce); // on parse pour avoir un objet utilisable
    delete sauceObject._id; 
    delete sauceObject._userId; // on supprime le champ _userId, en cas de personne malveillante (utilisation de l'id d'une autre personne)
    const sauce = new Sauce({
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` // req.protocol = on obtien le 1er segment de l'url (http), host = 'localhost:3000', req.file.name = nom du fichier
    });

    sauce.save()
      .then(() => { res.status(201).json({ message: 'Nouvelle sauce ajoutée !'})})
      .catch(error => { res.status(400).json({ error })})
};

exports.modifyingSauce = (req, res, next) => {
    const sauceObject = req.file ? { // opérateur ternaire pour regarder si req.file existe
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` // si oui on traite l'image
    } : { ...req.body }; // si non on traite l'objet entrant

    delete sauceObject._userId;
    Sauce.findOne({ _id: req.params.id})
      .then((sauce) => {
        if (sauce.userId != req.auth.userId) {
          res.status(401).json({ message: 'Non-autorisé' });
        } else {
          Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
          .then(() => res.status(200).json({ message: 'Sauce modifiée !' }))
          .catch(error => res.status(401).json({ error }));
        }
      })
      .catch((error) => {
        res.status(400).json({ error })
      });
  };

exports.deleteSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id})
    .then(sauce => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: 'Non-autorisé'});
      }else{
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => { //unlink permet de supprimer le fichier
          Sauce.deleteOne({ _id: req.params.id})
            .then(() => { res.status(200).json({ message: 'Sauce supprimée !' })})
            .catch(error => res.status(401).json({ error }));
        });
      }
    })
    .catch(error => {
      res.status(500).json({ error });
    }) 
  };

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id }) // méthode findOne = trouver un seul objet (thing unique) ayant le même _id que la paramètre de la requête
      .then(sauce => res.status(200).json(sauce))
      .catch(error => res.status(404).json({ error })); // 404 = objet non trouvé
  };

exports.getAllSauces = (req, res, next) => {
    Sauce.find() // méthode find = renvoie un tableau contenant tous les "things" dans la base de données
      .then(sauces => res.status(200).json(sauces))
      .catch(error => res.status(400).json({ error }));
  };