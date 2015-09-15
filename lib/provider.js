var fs = require('fs');
var Point, Range, ref;

ref = require('atom'), Point = ref.Point, Range = ref.Range;

//HookStuff
var hookSuggestions;
var hookRegex;

//LibStuff
var libSuggestions;
var libRegex

//Globals
var globalSuggestions;
var globalKeys;

//ClassFuncs
var classFuncSuggestions;

//PanelFuncs
var panelFuncSuggestions;

var getEditDistance = function(a, b) {
  if(a.length === 0) return b.length;
  if(b.length === 0) return a.length;

  var matrix = [];

  // increment along the first column of each row
  var i;
  for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }

  // increment each column in the first row
  var j;
  for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b.charAt(i-1) == a.charAt(j-1)){
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
                                Math.min(matrix[i][j-1] + 1, // insertion
                                         matrix[i-1][j] + 1)); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
};

var sortSuggestionsByLength = function(suggestions, prefix) {
    return suggestions.sort(function(a, b){
        return getEditDistance(a.name, prefix) - getEditDistance(b.name, prefix);
    });
}

module.exports = {
    selector: '.source.lua',
    disableForSelector: '.source.lua .comment, .string',

    inclusionPriority: 1,
    excludeLowerPriority: false,

    activate: function() {
        hookSuggestions = JSON.parse(fs.readFileSync(__dirname + '/hooks.json', 'utf8'));
        libSuggestions = JSON.parse(fs.readFileSync(__dirname + '/funcs.json', 'utf8'));
        globalSuggestions = JSON.parse(fs.readFileSync(__dirname + '/globals.json', 'utf8'));
        globalKeys = Object.keys(globalSuggestions);

        classFuncSuggestions = JSON.parse(fs.readFileSync(__dirname + '/classFuncs.json', 'utf8'));
        panelFuncSuggestions = JSON.parse(fs.readFileSync(__dirname + '/panelFuncs.json', 'utf8'));
    },

    getPrefix: function(editor, bufferPos) {
        var hookRegex = new RegExp('(?:function )?(?:(' + Object.keys(hookSuggestions).join('|') + ')\\:(.*))');
        var libRegex = new RegExp('(?:(' + Object.keys(libSuggestions).join('|') + '))\\.(.*)');
        var classRegex = new RegExp(':([^()\n]*)$');

        var line = editor.getTextInRange([[bufferPos.row, 0], bufferPos]);

        //hooks
        var match = line.match(hookRegex);
        if(match){
            return match;
        }

        //lib funcs
        match = line.match(libRegex)
        if(match){
            return match;
        }

        //class funcs
        match = line.match(classRegex)
        if(match){
            return match;
        }

        return '';
    },

    getSuggestions: function(arg) {
        var bufferPosition, editor, prefix, scopeDescriptor;
        editor = arg.editor;
        bufferPosition = arg.bufferPosition;
        scopeDescriptor = arg.scopeDescriptor;

        var otherPrefix = this.getPrefix(editor, bufferPosition)
        prefix = otherPrefix ? otherPrefix : arg.prefix;

        var buffer = editor.getBuffer();
        var text = buffer.getText();
        var index = buffer.characterIndexForPosition(bufferPosition);

        return new Promise(function(resolve) {

            var suggestions = [];

            if(typeof prefix != 'string')
            {
                if(hookSuggestions[prefix[1]])
                {
                    hookSuggestions[prefix[1]].forEach(function(item){
                        if(item.name.toLowerCase().indexOf(prefix[2].toLowerCase()) > -1)
                        {
                            suggestions.push({
                                name: item.name,
                                displayText: item.displayText,
                                replacementPrefix: prefix[0],
                                snippet: item.snippet,
                                leftLabel: item.leftLabel,
                                rightLabel: item.rightLabel,
                                type: item.type,
                                description: item.desc,
                                descriptionMoreURL: item.descUrl
                            });
                        }
                    });
                    return resolve(sortSuggestionsByLength(suggestions, prefix[1]));
                }
                if(libSuggestions[prefix[1]])
                {
                    libSuggestions[prefix[1]].forEach(function(item){
                        if(item.name.toLowerCase().indexOf(prefix[2].toLowerCase()) > -1)
                        {
                            suggestions.push({
                                name: item.name,
                                displayText: item.displayText,
                                replacementPrefix: prefix[0],
                                snippet: item.snippet,
                                leftLabel: item.leftLabel,
                                rightLabel: item.rightLabel,
                                type: item.type,
                                description: item.desc,
                                descriptionMoreURL: item.descUrl
                            });
                        }
                    });
                    return resolve(sortSuggestionsByLength(suggestions, prefix[1]));
                }
                if(prefix[0].length > 3)
                {
                    classFuncSuggestions.forEach(function(item) {
                        if(item.name.toLowerCase().indexOf(prefix[1].toLowerCase()) > -1)
                        {
                            suggestions.push({
                                name: item.name,
                                displayText: item.displayText,
                                replacementPrefix: prefix[1],
                                snippet: item.snippet,
                                leftLabel: item.leftLabel,
                                rightLabel: item.rightLabel,
                                type: item.type,
                                description: item.desc,
                                descriptionMoreURL: item.descUrl
                            });
                        }
                    });
                    return resolve(sortSuggestionsByLength(suggestions, prefix[1]));
                }
            }
            else if(prefix.length > 2) {
                globalKeys.forEach(function(key) {
                    if (key.toLowerCase().indexOf(prefix.toLowerCase()) > -1)
                    {
                        var item = globalSuggestions[key];
                        suggestions.push({
                            name: item.name,
                            displayText: item.displayText,
                            replacementPrefix: prefix,
                            snippet: item.snippet,
                            leftLabel: item.leftLabel,
                            rightLabel: item.rightLabel,
                            type: item.type,
                            description: item.desc,
                            descriptionMoreURL: item.descUrl
                        });
                    }
                })
            }
            return resolve(sortSuggestionsByLength(suggestions, prefix))
        });
    },

    onDidInsertSuggestion: function(arg) {
        var editor, suggestion, triggerPosition;
        editor = arg.editor;
        triggerPosition = arg.triggerPosition;
        suggestion = arg.suggestion;
    },

    dispose: function() {}
}
