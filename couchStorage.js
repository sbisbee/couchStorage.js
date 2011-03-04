var couchStorage = (function()
{
  $.couch.urlPrefix = '/db';

  var 
    //our storage device where we, uh, store things
    dataCylinder = {},

    //the key to use when writing to and reading from Storage objects
    BROWSER_STORAGE_KEY = "couchStorage",

    //the couchdb library we're using
    couchdb = $.couch.db('jquery');

  return {
    /*
     * Acts just like Storage.setItem, except it also tries to persist the
     * object into CouchDB using the key as the document's _id.
     *
     * Only accepts objects for values.
     */
    setItem: function(key, value)
    {
      if(value === null)
      {
        dataCylinder[key] = null;

        return null;
      }
      else if(typeof value == 'object')
      {
        value._id = key;

        var prevLocalCopy = dataCylinder[key];

        if(prevLocalCopy && prevLocalCopy._rev)
          value._rev = prevLocalCopy._rev;

        couchdb.saveDoc(
          value, 
          {
            success: function(resp) {
              value._rev = resp.rev;
              dataCylinder[key] = value;
            }
          }
        );
      }
      else
        throw new Error('Invalid type: value must be an object or null.');
    },

    /*
     * Returns the item from our local storage. If it is not found, then we try
     * to get the item from CouchDB, storing it locally if we succeed.
     *
     * Calls to CouchDB are done synchronously, which means that THIS FUNCTION
     * BLOCKS!!!!!!
     */
    getItem: function(key)
    {
      if(!dataCylinder[key])
      {
        couchdb.openDoc(
          key,
          {
            success: function(resp) {
              dataCylinder[key] = resp;
            },
          },
          {
            async: false
          }
        );
      }

      return dataCylinder[key];
    },

    /*
     * Attempt to copy our internal data structure into the passed Storage
     * object (ex., localStorage), allowing ourselves to be persisted.
     */
    writeTo: function(storage)
    {
      if(typeof storage != 'object' || !storage.setItem)
        throw new Error('Unsupported storage type.');

      storage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(dataCylinder));

      return storage;
    },

    /*
     * Attempt to read an internal data structure representation from the
     * passed Storage object (ex., localStorage).
     */
    readFrom: function(storage)
    {
      if(typeof storage != 'object' || !storage.getItem)
        throw new Error('Unsupported storage type.');

      dataCylinder = JSON.parse(storage.getItem(BROWSER_STORAGE_KEY));

      return storage;
    }
  };
})();
