/*
 Used in the trainer as an alternative to the JS console
 to display console.log() messages
 */

//PRECOMPILER_BEGINDELETE
const Logger = (function(){
  const _defaultSpec = {
    maxLinesCount: 500,
    DOMSelector: '#Logger'
  };
  let _spec = null;
  let _browserConsoleLog = null;
  let _jqLogger = null;
  let _linesCount = 0;
  let _counter = 0;
  let _groupCache = null;

  const _states = {
    notLoaded: -1,
    idle: 0,
    group: 2
  };
  let _state = _states.notLoaded;

  let _isFullScreen = false, _jqFullScreenButton = null;

  const that = {
    init: function(spec){
      if (!$){
        throw new Error('Logger.js requires JQuery');
      }
      if (_state !== _states.notLoaded){
        return;
      }

      _spec = Object.assign(_defaultSpec, spec);

      try {
        _browserConsoleLog = console.log;
        console.log = that.log;
      } catch(e){
        console.log('ERROR in Logger - init(): cannot override browser console.log');
      }

      _jqLogger = $(_spec.DOMSelector);

      // append some controls:
      const jqButtons = $('<div>').addClass('LoggerButtons').insertBefore(_jqLogger);
      _jqFullScreenButton = $('<button>').text('Expand').appendTo(jqButtons).click(that.toggle_fullScreen);
      $('<button>').text('Copy').appendTo(jqButtons).click(that.copy_toClipBoard);
      $('<button>').text('Clear').appendTo(jqButtons).click(that.clear);

      _state = _states.idle;      
    },

    toggle_fullScreen: function(){
      const jqLoggerParent = $(_jqLogger.parent());
      if (_isFullScreen){ // reduce:
        _jqFullScreenButton.text('Expand');
        jqLoggerParent.removeClass('LoggerFullScreen');
      } else { // expand:
        jqLoggerParent.addClass('LoggerFullScreen');
        _jqFullScreenButton.text('Reduce');
      }

      _isFullScreen = !_isFullScreen;
    },
    
    copy_toClipBoard: function(){
      const logLines = _jqLogger.children().map(function(jqChild){
        return $(this).text();
      }).toArray();
      const logText = logLines.join('\n');

      const ta = $('<textarea>').get(0);
      document.body.appendChild(ta);
      ta.value = logText;
      ta.select();
      ta.setSelectionRange(0, 99999); /*For mobile devices*/

      /* Copy the text inside the text field */
      document.execCommand("copy");
      document.body.removeChild(ta);
      alert('The logs have been copied in the clipboard');
    },

    forge: function(){
      // forge the log line text and the arguments array:
      const argsStr = [], argsArray = [];
      for (let i=0; i<arguments.length; ++i){

        const arg = arguments[i];
        argsArray.push(arg);
        let argStr = 'undefined';
        switch(typeof(arg)){
          case 'object':
            argStr = JSON.stringify(arg);
            break;
          case 'undefined':
            break;
          default:
            argStr = arg.toString();
            break;
        };
        argsStr.push(argStr);
      }
      const logText = argsStr.join(' ');
      return {
        text: logText,
        arr: argsArray
      };
    },

    display: function(log, count){
      // still log in the real javascript console:
      _browserConsoleLog.apply(window, log.arr);

      // color the jquery element:
      let firstWord = log.text.split(' ').shift();
      firstWord = firstWord.split(':').shift();
      firstWord = firstWord.toUpperCase();
      let subClass = '';
      switch(firstWord){
        case 'ERROR':
          subClass = 'LoggerLineError';
          break;
        case 'WARNING':
          subClass = 'LoggerLineWarning';
          break;
        case 'DEBUG':
          subClass = 'LoggerLineDebug';
          break;
        case 'INFO':
          subClass = 'LoggerLineInfo';
          break;
      }

      let logText = log.text;
      if (count){
        logText = 'X' + count.toString() + ' ' + logText;
      }

      that.log_rawHtml(logText, subClass);
    },

    log_rawHtml: function(logHtml, subClass){
      const subClassParity = (++_counter%2 === 0) ? 'LoggerLineEven' : 'LoggerLineOdd';

      // build the jquery element:
      const logJq = $('<div>').html(logHtml).addClass('LoggerLine').addClass(subClassParity);
      if (subClass){
        logJq.addClass(subClass);
      }

      // append the new line
      _jqLogger.append(logJq);

      // remove the older log if _spec.maxLinesCount reached
      if (_linesCount === _spec.maxLinesCount){
        _jqLogger.children().first().remove();
      } else {
        ++_linesCount;
      }

      if (that.is_scrollOnLast()){
        that.scroll_toLast();
      }
    },

    log_rawText: function(logText, subClass){
      const logHtml = logText.replace(/\n/g, '<br>');
      that.log_rawHtml(logHtml, subClass || '');
    },

    log: function(){
      const log = that.forge.apply(null, arguments);
      switch(_state){
        case _states.idle:
          that.display(log, 0);
          break;
        case _states.group:
          if (log.text in _groupCache){
            ++_groupCache[log.text].count;
          } else {
            _groupCache[log.text] = {
              arr: log.arr,
              count: 1
            };
          }
          break;
      }
    },

    is_scrollOnLast: function(){
      const scrollPosition = _jqLogger.parent().height() + _jqLogger.parent().scrollTop();
      const totalHeight = _jqLogger.height();
      return (scrollPosition + 20 >= totalHeight);
    },

    scroll_toLast: function(){
      _jqLogger.parent()[0].scrollTo(0, _jqLogger.prop('scrollHeight'));
    },

    begin_group: function(){
      _state = _states.group;
      _groupCache = {};
    },

    end_group: function(){
      _state = _states.idle;
      const logTexts = Object.keys(_groupCache);

      // sort from most logged to less logged:
      logTexts.sort(function(logTextA, logTextB){
        const countA = _groupCache[logTextA].count;
        const countB = _groupCache[logTextB].count;
        return (countA - countB);
      });

      // log cache:
      logTexts.forEach(function(logText){
        const logCached = _groupCache[logText];
        that.display({
          text: logText,
          arr: logCached.arr
        }, logCached.count);
      });
      _groupCache = null;
    },

    clear: function(){
      _linesCount = 0;
      _counter = 0;
      _jqLogger.empty();
    },

    debug: function(){
      for (let i=0; i<100; ++i){
        that.log('DEBUG in Logger.debug - n° ', i, {a: 2});
      }
    }
  }; //end that
  return that;
})();
//PRECOMPILER_ENDDELETE 
