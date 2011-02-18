(function()
{
  if(!window.couchStorage)
    window.couchStorage = {};

  $.couch.urlPrefix = "/db";

  window.couchStorage.start = function()
  {
    Storage.prototype._oldSetItem = Storage.prototype.setItem;
    Storage.prototype._oldGetItem = Storage.prototype.getItem;

    Storage.prototype.setItem = function(key, value)
    {
      var db = $.couch.db("jquery"),
          currStorage = this;

      if(!value)
      {
        var toDelete = currStorage.getItem(key);

        if(toDelete)
          db.removeDoc(toDelete);

        return null;
      }
      else if(typeof value == "object")
      {
        value._id = key;

        var prevLocalCopy = currStorage.getItem(key);
        if(prevLocalCopy && prevLocalCopy._rev)
          value._rev = prevLocalCopy._rev;

        db.saveDoc(
          value, 
          {
            success: function(resp) {
              value._rev = resp.rev;
              currStorage._oldSetItem(key, JSON.stringify(value)); 
            }
          }
        );

        return value;
      }

      return currStorage._oldSetItem(key, value);
    };

    Storage.prototype.getItem = function(key)
    {
      var value = this._oldGetItem(key);

      try
      {
        return JSON.parse(value);
      }
      catch(e)
      {
        return value;
      }
    };
  }
})();
