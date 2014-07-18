(function(root,$,_,Dropbox) {
	'use strict';
	var client = new Dropbox.Client({
		key : 'pg3jydep67ckz3e'
	});
	
	var folderEntry;

	var chooseDisk = function() {
		chrome.fileSystem.chooseEntry({
			type : 'openDirectory'
		}, function(entry) {
			folderEntry = chrome.fileSystem.retainEntry(entry);
			//console.log('User prefenence folderEntry: ' + folderEntry);
			chrome.storage.local.set({
				'folderEntry' : folderEntry
			}, function() {
				// Notify that we saved.
				//console.log('Settings saved');
				chrome.fileSystem.restoreEntry(folderEntry, function(dirEntry) {
					$('.entry').hide();
					$('.disk').show();
					$('.alert').hide();
					$('.disk').html(dirEntry.fullPath);
					chrome.fileSystem.getWritableEntry(dirEntry, function(wDirEntry) {
						sync(wDirEntry);
					});
				});
			});
		});
	};
	
	chrome.storage.local.get('folderEntry', function(item) {
		if (item.folderEntry) {
			folderEntry = item.folderEntry;
			if (!folderEntry) {
				chooseDisk();
			} else {
				chrome.fileSystem.restoreEntry(folderEntry, function(dirEntry) {
					if (dirEntry) {
						$('.entry').hide();
						$('.disk').show();
						$('.alert').hide();
						$('.disk').html(dirEntry.fullPath);
						chrome.fileSystem.getWritableEntry(dirEntry, function(wDirEntry) {
							sync(wDirEntry);
						});
					} else {
						$('.entry').show();
						$('.disk').hide();
						$('.alert').show();
						$('.chooseEntry').on('click', function() {
							chooseDisk();
						});
					}
				});

			}
		} else {
			chooseDisk();
		}

	});

	var sync = function(folderEntry) {

		//
		client.authenticate({
			interactive : true
		}, function(error, client) {
			if (error) {
				// Replace with a call to your own error-handling code.
				//
				// Don't forget to return from the callback, so you don't execute the code
				// that assumes everything went well.
				console.log(error);
				return;
			}

			//Dropbox.AuthDriver.ChromeExtension.oauthReceiver();

			client.getAccountInfo(function(error, accountInfo) {
				if (error) {
					console.log(error);
					// Something went wrong.
					return;
				}

				$('.profile').html(accountInfo.name);
			});

			client.readdir('/', function(error, entries, stat, stats) {
				if (error) {
					console.log(error);
					// Something went wrong.
					return;
				}
				
				var writeFileToDisk = function(fileEntry, data){
					fileEntry.createWriter(function(writer) {
						writer.write(data);
					});
				}, readFileFormDropbox = function(fileEntry) {
					//console.log(fileEntry);

					client.readFile(fileEntry.name, {
						blob : true
					}, function(error, data) {
						if (error) {
							console.log(error);
							// Something went wrong.
							return;
						}
						writeFileToDisk(fileEntry,data);
								
					});
				};
				
				for (var s in stats) {
					if (stats[s].isFile) {
						//console.log(stats[s]);
						var wp = stats[s].path;

						$('.dropbox').append($('<li>' + wp + '</li>'));

						folderEntry.getFile(wp.substring(1), {
							create : true
						}, readFileFormDropbox);
					}
				}
			});
		});
	};
})(this,this.$,this._,this.Dropbox);