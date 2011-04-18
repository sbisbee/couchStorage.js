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
     */
    setItem: function(key, value)
    {
      doc = { _id: key, d: value };

      var prevLocalCopy = dataCylinder[key];

      if(prevLocalCopy && prevLocalCopy._rev)
        doc._rev = prevLocalCopy._rev;

      couchdb.saveDoc(
        doc,
        {
          success: function(resp) {
            doc._rev = resp.rev;
            dataCylinder[key] = doc;
          }
        }
      );
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

      return dataCylinder[key].d;
    },

    /*
     * The same as getItem(), except it also takes a callback because it makes
     * an asynchronous AJAX call (no blocking). The success callback will be
     * passed the value to its first parameter. If the value was retrieved
     * using AJAX, meaning that it was not available locally, then the second
     * parameter will be the server's response as you would get in the AJAX's
     * success function.
     */
    getItemAsync: function(key, success)
    {
      if(!dataCylinder[key])
        couchdb.openDoc(
                        key,
                        {
                          success: function(resp) {
                            dataCylinder[key] = resp;

                            success(dataCylinder[key].d, resp);
                          }
                        }
                      );
      else
        success(dataCylinder[key].d);
    },

    /*
     * Attempt to copy our internal data structure into the passed Storage
     * object (ex., localStorage), allowing ourselves to be persisted. If
     * passing your own object, then make sure it implements getItem() and
     * setItem().
     */
    writeTo: function(storage)
    {
      if(!storage.setItem)
        throw new Error('Unsupported storage type - must implement setItem().');

      storage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(dataCylinder));

      return storage;
    },

    /*
     * Attempt to read an internal data structure representation from the
     * passed Storage object (ex., localStorage). If passing your own object,
     * then make sure it implements getItem() and setItem().
     */
    readFrom: function(storage)
    {
      if(!storage.getItem)
        throw new Error('Unsupported storage type - must implement getItem().');

      dataCylinder = JSON.parse(storage.getItem(BROWSER_STORAGE_KEY));

      return storage;
    }
  };
})();
