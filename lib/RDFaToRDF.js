var N3 = require('n3');
var jsonld = require('jsonld');
var jsonldRdfaParser = require('jsonld-rdfa-parser');
module.exports = class {

  constructor (options) {
    jsonld.registerRDFParser('text/html', jsonldRdfaParser);
    this.documentIRI = options.documentIRI;
  }

  parse (document, callback) {
    var convertEntity = function (entity) {
      // Return IRIs and blank nodes as-is
      if (entity.type !== 'literal')
        return entity.value;
      else {
        // Add a language tag to the literal if present
        if ('language' in entity)
          return '"' + entity.value + '"@' + entity.language;
        // Add a datatype to the literal if present
        if (entity.datatype !== 'http://www.w3.org/2001/XMLSchema#string')
          return '"' + entity.value + '"^^' + entity.datatype;
        // Otherwise, return the regular literal
        return '"' + entity.value + '"';
      }
    }
    jsonld.fromRDF(document, {format: 'text/html', base: this.documentIRI}, function(err, data) {
      var prefixes = [];
      //read context
      jsonld.toRDF(data, function(error, triples) {
        for (var graphName in triples) {
          triples[graphName].forEach(function (triple, index) {
            callback(null, { subject : triple.subject.value,
                             predicate : triple.predicate.value,
                             object : convertEntity(triple.object)});
            if (index === triples[graphName].length-1 ) {
              //This is the end
              callback(null, null);
            }
          });
        }
        if (error) {
          callback(error);
        }
      });
    });    
  }
}