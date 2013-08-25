/* =============================================================

    Smooth Scroll 2.2
    Animate scrolling to anchor links, by Chris Ferdinandi.
    http://gomakethings.com

    Free to use under the MIT License.
    http://gomakethings.com/mit/
    
 * ============================================================= */

// Feature Test
if ( 'querySelector' in document && 'addEventListener' in window && Array.prototype.forEach ) {

    // Function to animate the scroll
    var smoothScroll = function (anchor, duration) {

        // Calculate how far and how fast to scroll
        var startLocation = window.pageYOffset;
        var endLocation = anchor.offsetTop;
        var distance = endLocation - startLocation;
        var increments = distance/(duration/16);

        // Scroll the page by an increment, and check if it's time to stop
        var animateScroll = function () {
            window.scrollBy(0, increments);
            stopAnimation();
        }

        // If scrolling down
        if ( increments >= 0 ) {
            // Stop animation when you reach the anchor OR the bottom of the page
            var stopAnimation = function () {
                var travelled = window.pageYOffset;
                if ( (travelled >= (endLocation - increments)) || ((window.innerHeight + travelled) >= document.body.offsetHeight) ) {
                    clearInterval(runAnimation);
                }
            }
        }
        // If scrolling up
        else {
            // Stop animation when you reach the anchor OR the top of the page
            var stopAnimation = function () {
                var travelled = window.pageYOffset;
                if ( travelled <= (endLocation || 0) ) {
                    clearInterval(runAnimation);
                }
            }
        }

        // Loop the animation function
        var runAnimation = setInterval(animateScroll, 16);
   
    }

    // Define smooth scroll links
    var scrollToggle = document.querySelectorAll('.scroll');

    // For each smooth scroll link
    [].forEach.call(scrollToggle, function (toggle) {

        // When the smooth scroll link is clicked
        toggle.addEventListener('click', function(e) {

            // Prevent the default link behavior
            e.preventDefault();

            // Get anchor link and calculate distance from the top
            var dataID = toggle.getAttribute('href');
            var dataTarget = document.querySelector(dataID);
            var dataSpeed = toggle.getAttribute('data-speed');

            // If the anchor exists
            if (dataTarget) {
                // Scroll to the anchor
                smoothScroll(dataTarget, dataSpeed || 500);
            }

        }, false);

    });

}





/* =============================================================

    Prism v1.0
    Lightweight, robust, elegant syntax highlighting, by Lea Verou
    http://lea.verou.me

    Licensed under MIT License.
    http://www.opensource.org/licenses/mit-license.php/

 * ============================================================= */

(function(){

// Private helper vars
var lang = /\blang(?:uage)?-(?!\*)(\w+)\b/i;

var _ = self.Prism = {
	util: {
		type: function (o) { 
			return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
		},
		
		// Deep clone a language definition (e.g. to extend it)
		clone: function (o) {
			var type = _.util.type(o);

			switch (type) {
				case 'Object':
					var clone = {};
					
					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = _.util.clone(o[key]);
						}
					}
					
					return clone;
					
				case 'Array':
					return o.slice();
			}
			
			return o;
		}
	},
	
	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);
			
			for (var key in redef) {
				lang[key] = redef[key];
			}
			
			return lang;
		},
		
		// Insert a token before another token in a language literal
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];
			var ret = {};
				
			for (var token in grammar) {
			
				if (grammar.hasOwnProperty(token)) {
					
					if (token == before) {
					
						for (var newToken in insert) {
						
							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}
					
					ret[token] = grammar[token];
				}
			}
			
			return root[inside] = ret;
		},
		
		// Traverse a language definition with Depth First Search
		DFS: function(o, callback) {
			for (var i in o) {
				callback.call(o, i, o[i]);
				
				if (_.util.type(o) === 'Object') {
					_.languages.DFS(o[i], callback);
				}
			}
		}
	},

	highlightAll: function(async, callback) {
		var elements = document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code');

		for (var i=0, element; element = elements[i++];) {
			_.highlightElement(element, async === true, callback);
		}
	},
		
	highlightElement: function(element, async, callback) {
		// Find language
		var language, grammar, parent = element;
		
		while (parent && !lang.test(parent.className)) {
			parent = parent.parentNode;
		}
		
		if (parent) {
			language = (parent.className.match(lang) || [,''])[1];
			grammar = _.languages[language];
		}

		if (!grammar) {
			return;
		}
		
		// Set language on the element, if not present
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
		
		// Set language on the parent, for styling
		parent = element.parentNode;
		
		if (/pre/i.test(parent.nodeName)) {
			parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language; 
		}

		var code = element.textContent;
		
		if(!code) {
			return;
		}
		
		code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
		
		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};
		
		_.hooks.run('before-highlight', env);
		
		if (async && self.Worker) {
			var worker = new Worker(_.filename);	
			
			worker.onmessage = function(evt) {
				env.highlightedCode = Token.stringify(JSON.parse(evt.data), language);

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;
				
				callback && callback.call(env.element);
				_.hooks.run('after-highlight', env);
			};
			
			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code
			}));
		}
		else {
			env.highlightedCode = _.highlight(env.code, env.grammar, env.language)

			_.hooks.run('before-insert', env);

			env.element.innerHTML = env.highlightedCode;
			
			callback && callback.call(element);
			
			_.hooks.run('after-highlight', env);
		}
	},
	
	highlight: function (text, grammar, language) {
		return Token.stringify(_.tokenize(text, grammar), language);
	},
	
	tokenize: function(text, grammar, language) {
		var Token = _.Token;
		
		var strarr = [text];
		
		var rest = grammar.rest;
		
		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}
			
			delete grammar.rest;
		}
								
		tokenloop: for (var token in grammar) {
			if(!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}
			
			var pattern = grammar[token], 
				inside = pattern.inside,
				lookbehind = !!pattern.lookbehind,
				lookbehindLength = 0;
			
			pattern = pattern.pattern || pattern;
			
			for (var i=0; i<strarr.length; i++) { // Don’t cache length as it changes during the loop
				
				var str = strarr[i];
				
				if (strarr.length > text.length) {
					// Something went terribly wrong, ABORT, ABORT!
					break tokenloop;
				}
				
				if (str instanceof Token) {
					continue;
				}
				
				pattern.lastIndex = 0;
				
				var match = pattern.exec(str);
				
				if (match) {
					if(lookbehind) {
						lookbehindLength = match[1].length;
					}

					var from = match.index - 1 + lookbehindLength,
					    match = match[0].slice(lookbehindLength),
					    len = match.length,
					    to = from + len,
						before = str.slice(0, from + 1),
						after = str.slice(to + 1); 

					var args = [i, 1];
					
					if (before) {
						args.push(before);
					}
					
					var wrapped = new Token(token, inside? _.tokenize(match, inside) : match);
					
					args.push(wrapped);
					
					if (after) {
						args.push(after);
					}
					
					Array.prototype.splice.apply(strarr, args);
				}
			}
		}

		return strarr;
	},
	
	hooks: {
		all: {},
		
		add: function (name, callback) {
			var hooks = _.hooks.all;
			
			hooks[name] = hooks[name] || [];
			
			hooks[name].push(callback);
		},
		
		run: function (name, env) {
			var callbacks = _.hooks.all[name];
			
			if (!callbacks || !callbacks.length) {
				return;
			}
			
			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	}
};

var Token = _.Token = function(type, content) {
	this.type = type;
	this.content = content;
};

Token.stringify = function(o, language, parent) {
	if (typeof o == 'string') {
		return o;
	}

	if (Object.prototype.toString.call(o) == '[object Array]') {
		return o.map(function(element) {
			return Token.stringify(element, language, o);
		}).join('');
	}
	
	var env = {
		type: o.type,
		content: Token.stringify(o.content, language, parent),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language,
		parent: parent
	};
	
	if (env.type == 'comment') {
		env.attributes['spellcheck'] = 'true';
	}
	
	_.hooks.run('wrap', env);
	
	var attributes = '';
	
	for (var name in env.attributes) {
		attributes += name + '="' + (env.attributes[name] || '') + '"';
	}
	
	return '<' + env.tag + ' class="' + env.classes.join(' ') + '" ' + attributes + '>' + env.content + '</' + env.tag + '>';
	
};

if (!self.document) {
	// In worker
	self.addEventListener('message', function(evt) {
		var message = JSON.parse(evt.data),
		    lang = message.language,
		    code = message.code;
		
		self.postMessage(JSON.stringify(_.tokenize(code, _.languages[lang])));
		self.close();
	}, false);
	
	return;
}

// Get current script and highlight
var script = document.getElementsByTagName('script');

script = script[script.length - 1];

if (script) {
	_.filename = script.src;
	
	if (document.addEventListener && !script.hasAttribute('data-manual')) {
		document.addEventListener('DOMContentLoaded', _.highlightAll);
	}
}

})();;
Prism.languages.markup = {
	'comment': /&lt;!--[\w\W]*?-->/g,
	'prolog': /&lt;\?.+?\?>/,
	'doctype': /&lt;!DOCTYPE.+?>/,
	'cdata': /&lt;!\[CDATA\[[\w\W]*?]]>/i,
	'tag': {
		pattern: /&lt;\/?[\w:-]+\s*(?:\s+[\w:-]+(?:=(?:("|')(\\?[\w\W])*?\1|\w+))?\s*)*\/?>/gi,
		inside: {
			'tag': {
				pattern: /^&lt;\/?[\w:-]+/i,
				inside: {
					'punctuation': /^&lt;\/?/,
					'namespace': /^[\w-]+?:/
				}
			},
			'attr-value': {
				pattern: /=(?:('|")[\w\W]*?(\1)|[^\s>]+)/gi,
				inside: {
					'punctuation': /=|>|"/g
				}
			},
			'punctuation': /\/?>/g,
			'attr-name': {
				pattern: /[\w:-]+/g,
				inside: {
					'namespace': /^[\w-]+?:/
				}
			}
			
		}
	},
	'entity': /&amp;#?[\da-z]{1,8};/gi
};

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});;
Prism.languages.css = {
	'comment': /\/\*[\w\W]*?\*\//g,
	'atrule': {
		pattern: /@[\w-]+?.*?(;|(?=\s*{))/gi,
		inside: {
			'punctuation': /[;:]/g
		}
	},
	'url': /url\((["']?).*?\1\)/gi,
	'selector': /[^\{\}\s][^\{\};]*(?=\s*\{)/g,
	'property': /(\b|\B)[\w-]+(?=\s*:)/ig,
	'string': /("|')(\\?.)*?\1/g,
	'important': /\B!important\b/gi,
	'ignore': /&(lt|gt|amp);/gi,
	'punctuation': /[\{\};:]/g
};

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /(&lt;|<)style[\w\W]*?(>|&gt;)[\w\W]*?(&lt;|<)\/style(>|&gt;)/ig,
			inside: {
				'tag': {
					pattern: /(&lt;|<)style[\w\W]*?(>|&gt;)|(&lt;|<)\/style(>|&gt;)/ig,
					inside: Prism.languages.markup.tag.inside
				},
				rest: Prism.languages.css
			}
		}
	});
};
Prism.languages.clike = {
	'comment': {
		pattern: /(^|[^\\])(\/\*[\w\W]*?\*\/|(^|[^:])\/\/.*?(\r?\n|$))/g,
		lookbehind: true
	},
	'string': /("|')(\\?.)*?\1/g,
	'class-name': {
		pattern: /((?:(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/ig,
		lookbehind: true,
		inside: {
			punctuation: /(\.|\\)/
		}
	},
	'keyword': /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/g,
	'boolean': /\b(true|false)\b/g,
	'function': {
		pattern: /[a-z0-9_]+\(/ig,
		inside: {
			punctuation: /\(/
		}
	},
	'number': /\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/g,
	'operator': /[-+]{1,2}|!|&lt;=?|>=?|={1,3}|(&amp;){1,2}|\|?\||\?|\*|\/|\~|\^|\%/g,
	'ignore': /&(lt|gt|amp);/gi,
	'punctuation': /[{}[\];(),.:]/g
};
;
Prism.languages.javascript = Prism.languages.extend('clike', {
	'keyword': /\b(var|let|if|else|while|do|for|return|in|instanceof|function|new|with|typeof|try|throw|catch|finally|null|break|continue)\b/g,
	'number': /\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?|NaN|-?Infinity)\b/g
});

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/g,
		lookbehind: true
	}
});

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /(&lt;|<)script[\w\W]*?(>|&gt;)[\w\W]*?(&lt;|<)\/script(>|&gt;)/ig,
			inside: {
				'tag': {
					pattern: /(&lt;|<)script[\w\W]*?(>|&gt;)|(&lt;|<)\/script(>|&gt;)/ig,
					inside: Prism.languages.markup.tag.inside
				},
				rest: Prism.languages.javascript
			}
		}
	});
}
;
/**
 * Original by Aaron Harun: http://aahacreative.com/2012/07/31/php-syntax-highlighting-prism/
 * Modified by Miles Johnson: http://milesj.me
 *
 * Supports the following:
 * 		- Extends clike syntax
 * 		- Support for PHP 5.3 and 5.4 (namespaces, traits, etc)
 * 		- Smarter constant and function matching
 *
 * Adds the following new token classes:
 * 		constant, delimiter, variable, function, package
 */

Prism.languages.php = Prism.languages.extend('clike', {
	'keyword': /\b(and|or|xor|array|as|break|case|cfunction|class|const|continue|declare|default|die|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|for|foreach|function|include|include_once|global|if|new|return|static|switch|use|require|require_once|var|while|abstract|interface|public|implements|extends|private|protected|parent|static|throw|null|echo|print|trait|namespace|use|final|yield|goto|instanceof|finally|try|catch)\b/ig,
	'constant': /\b[A-Z0-9_]{2,}\b/g
});

Prism.languages.insertBefore('php', 'keyword', {
	'delimiter': /(\?>|&lt;\?php|&lt;\?)/ig,
	'variable': /(\$\w+)\b/ig,
	'package': {
		pattern: /(\\|namespace\s+|use\s+)[\w\\]+/g,
		lookbehind: true,
		inside: {
			punctuation: /\\/
		}
	}
});

// Must be defined after the function pattern
Prism.languages.insertBefore('php', 'operator', {
	'property': {
		pattern: /(->)[\w]+/g,
		lookbehind: true
	}
});

// Add HTML support of the markup language exists
if (Prism.languages.markup) {

	// Tokenize all inline PHP blocks that are wrapped in <?php ?>
	// This allows for easy PHP + markup highlighting
	Prism.hooks.add('before-highlight', function(env) {
		if (env.language !== 'php') {
			return;
		}

		env.tokenStack = [];

		env.code = env.code.replace(/(?:&lt;\?php|&lt;\?|<\?php|<\?)[\w\W]*?(?:\?&gt;|\?>)/ig, function(match) {
			env.tokenStack.push(match);

			return '{{{PHP' + env.tokenStack.length + '}}}';
		});
	});

	// Re-insert the tokens after highlighting
	Prism.hooks.add('after-highlight', function(env) {
		if (env.language !== 'php') {
			return;
		}

		for (var i = 0, t; t = env.tokenStack[i]; i++) {
			env.highlightedCode = env.highlightedCode.replace('{{{PHP' + (i + 1) + '}}}', Prism.highlight(t, env.grammar, 'php'));
		}

		env.element.innerHTML = env.highlightedCode;
	});

	// Wrap tokens in classes that are missing them
	Prism.hooks.add('wrap', function(env) {
		if (env.language === 'php' && env.type === 'markup') {
			env.content = env.content.replace(/(\{\{\{PHP[0-9]+\}\}\})/g, "<span class=\"token php\">$1</span>");
		}
	});

	// Add the rules before all others
	Prism.languages.insertBefore('php', 'comment', {
		'markup': {
			pattern: /(&lt;|<)[^?]\/?(.*?)(>|&gt;)/g,
			inside: Prism.languages.markup
		},
		'php': /\{\{\{PHP[0-9]+\}\}\}/g
	});
};





/* =============================================================

    Fluid Vids v1.0
    Fluid and responsive YouTube and Vimeo videos, by Todd Motto.
    https://github.com/toddmotto/fluidvids

    Remixed by Chris Ferdinandi.
    http://gomakethings.com

    Licensed under MIT License.
    http://toddmotto.com/licensing

 * ============================================================= */

(function() {
	var iframes = document.getElementsByTagName('iframe');
	
	for (var i = 0; i < iframes.length; ++i) {
		var iframe = iframes[i];
		var players = /www.youtube.com|player.vimeo.com|www.hulu.com|www.slideshare.net/;
		if(iframe.src.search(players) !== -1) {
			var videoRatio = (iframe.height / iframe.width) * 100;
			
			iframe.style.position = 'absolute';
			iframe.style.top = '0';
			iframe.style.left = '0';
			iframe.width = '100%';
			iframe.height = '100%';
			
			var div = document.createElement('div');
			div.className = 'video-wrap';
			div.style.width = '100%';
			div.style.position = 'relative';
			div.style.paddingTop = videoRatio + '%';
			
			var parentNode = iframe.parentNode;
			parentNode.insertBefore(div, iframe);
			div.appendChild(iframe);
		}
	}
})();





/* =============================================================

    Slider v3.0
    A simple, responsive, touch-enabled image slider, forked from Swipe.

    Script by Brad Birdsall.
    http://swipejs.com/

    Forked by Chris Ferdinandi.
    http://gomakethings.com

    Code contributed by Ron Ilan.
    https://github.com/bradbirdsall/Swipe/pull/277

    Licensed under the MIT license.
    http://gomakethings.com/mit/
    
 * ============================================================= */

if ( 'querySelector' in document && 'addEventListener' in window ) {

    var Swipe = function (container, options) {

      "use strict";

      // utilities
      var noop = function() {}; // simple no operation function
      var offloadFn = function(fn) { setTimeout(fn || noop, 0) }; // offload a functions execution
      
      // check browser capabilities
      var browser = {
        addEventListener: !!window.addEventListener,
        touch: ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch,
        transitions: (function(temp) {
          var props = ['transitionProperty', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'];
          for ( var i in props ) if (temp.style[ props[i] ] !== undefined) return true;
          return false;
        })(document.createElement('swipe'))
      };

      // quit if no root element
      if (!container) return;
      var element = container.children[0];
      var slides, slidePos, width, length;
      options = options || {};
      var index = parseInt(options.startSlide - 1, 10) || 0;
      var speed = options.speed || 300;
      options.continuous = options.continuous !== undefined ? options.continuous : true;

      var setup = function () {

        // cache slides
        slides = element.children;
        length = slides.length;

        // set continuous to false if only one slide
        if (slides.length < 2) options.continuous = false;

        // create an array to store current positions of each slide
        slidePos = new Array(slides.length);

        // determine width of each slide
        width = container.getBoundingClientRect().width || container.offsetWidth;

        element.style.width = (slides.length * width) + 'px';

        // stack elements
        var pos = slides.length;
        while(pos--) {

          var slide = slides[pos];

          slide.style.width = width + 'px';
          slide.setAttribute('data-index', pos);

          if (browser.transitions) {
            slide.style.left = (pos * -width) + 'px';
            move(pos, index > pos ? -width : (index < pos ? width : 0), 0);
          }

        }

        // reposition elements before and after index
        if (options.continuous && browser.transitions) {
          move(circle(index-1), -width, 0);
          move(circle(index+1), width, 0);
        }

        if (!browser.transitions) element.style.left = (index * -width) + 'px';

        visibleThree(index, slides);

        container.style.visibility = 'visible';

      }

      var prev = function () {

        if (options.continuous) slide(index-1);
        else if (index) slide(index-1);

      }

      var next = function () {

        if (options.continuous) slide(index+1);
        else if (index < slides.length - 1) slide(index+1);

      }

      var circle = function (index) {

        // a simple positive modulo using slides.length
        return (slides.length + (index % slides.length)) % slides.length;

      }

      var slide = function (to, slideSpeed) {

        // do nothing if already on requested slide
        if (index == to) return;
        
        if (browser.transitions) {

          var direction = Math.abs(index-to) / (index-to); // 1: backward, -1: forward

          // get the actual position of the slide
          if (options.continuous) {
            var natural_direction = direction;
            direction = -slidePos[circle(to)] / width;

            // if going forward but to < index, use to = slides.length + to
            // if going backward but to > index, use to = -slides.length + to
            if (direction !== natural_direction) to =  -direction * slides.length + to;

          }

          var diff = Math.abs(index-to) - 1;

          // move all the slides between index and to in the right direction
          while (diff--) move( circle((to > index ? to : index) - diff - 1), width * direction, 0);
                
          to = circle(to);

          move(index, width * direction, slideSpeed || speed);
          move(to, 0, slideSpeed || speed);

          if (options.continuous) move(circle(to - direction), -(width * direction), 0); // we need to get the next in place
          
        } else {     
          
          to = circle(to);
          animate(index * -width, to * -width, slideSpeed || speed);
          //no fallback for a circular continuous if the browser does not accept transitions
        }

        index = to;
        visibleThree(index, slides);
        offloadFn(options.callback && options.callback(index, slides[index]));
      }

      var move = function (index, dist, speed) {

        translate(index, dist, speed);
        slidePos[index] = dist;

      }

      var translate = function (index, dist, speed) {

        var slide = slides[index];
        var style = slide && slide.style;

        if (!style) return;

        style.webkitTransitionDuration = 
        style.MozTransitionDuration = 
        style.msTransitionDuration = 
        style.OTransitionDuration = 
        style.transitionDuration = speed + 'ms';

        style.webkitTransform = 'translate(' + dist + 'px,0)' + 'translateZ(0)';
        style.msTransform = 
        style.MozTransform = 
        style.OTransform = 'translateX(' + dist + 'px)';

      }

      var animate = function (from, to, speed) {

        // if not an animation, just reposition
        if (!speed) {

          element.style.left = to + 'px';
          return;

        }
        
        var start = +new Date;
        
        var timer = setInterval(function() {

          var timeElap = +new Date - start;
          
          if (timeElap > speed) {

            element.style.left = to + 'px';

            if (delay) begin();

            options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

            clearInterval(timer);
            return;

          }

          element.style.left = (( (to - from) * (Math.floor((timeElap / speed) * 100) / 100) ) + from) + 'px';

        }, 4);

      }

      // hide all slides then show only current, next and prev
      function visibleThree(index, slides) {

        var pos = slides.length;

        while(pos--) {

          slides[pos].style.visibility = 'hidden';

          if(pos === circle(index) || pos === circle(index-1) || pos === circle(index+1)){
            slides[pos].style.visibility = 'visible';
          }

        }

      }

      // setup auto slideshow
      var delay = options.auto || 0;
      var interval;

      var begin = function () {

        interval = setTimeout(next, delay);

      }

      var stop = function () {

        delay = 0;
        clearTimeout(interval);

      }


      // setup initial vars
      var start = {};
      var delta = {};
      var isScrolling;      

      // setup event capturing
      var events = {

        handleEvent: function(event) {

          switch (event.type) {
            case 'touchstart': this.start(event); break;
            case 'touchmove': this.move(event); break;
            case 'touchend': offloadFn(this.end(event)); break;
            case 'webkitTransitionEnd':
            case 'msTransitionEnd':
            case 'oTransitionEnd':
            case 'otransitionend':
            case 'transitionend': offloadFn(this.transitionEnd(event)); break;
            case 'resize': offloadFn(setup.call()); break;
          }

          if (options.stopPropagation) event.stopPropagation();

        },
        start: function(event) {

          var touches = event.touches[0];

          // measure start values
          start = {

            // get initial touch coords
            x: touches.pageX,
            y: touches.pageY,

            // store time to determine touch duration
            time: +new Date

          };
          
          // used for testing first move event
          isScrolling = undefined;

          // reset delta and end measurements
          delta = {};

          // attach touchmove and touchend listeners
          element.addEventListener('touchmove', this, false);
          element.addEventListener('touchend', this, false);

        },
        move: function(event) {

          // ensure swiping with one touch and not pinching
          if ( event.touches.length > 1 || event.scale && event.scale !== 1) return

          if (options.disableScroll) event.preventDefault();

          var touches = event.touches[0];

          // measure change in x and y
          delta = {
            x: touches.pageX - start.x,
            y: touches.pageY - start.y
          }

          // determine if scrolling test has run - one time test
          if ( typeof isScrolling == 'undefined') {
            isScrolling = !!( isScrolling || Math.abs(delta.x) < Math.abs(delta.y) );
          }

          // if user is not trying to scroll vertically
          if (!isScrolling) {

            // prevent native scrolling 
            event.preventDefault();

            // stop slideshow
            stop();

            // increase resistance if first or last slide
            if (options.continuous) { // we don't add resistance at the end

              translate(circle(index-1), delta.x + slidePos[circle(index-1)], 0);
              translate(index, delta.x + slidePos[index], 0);
              translate(circle(index+1), delta.x + slidePos[circle(index+1)], 0);

            } else {

              delta.x = 
                delta.x / 
                  ( (!index && delta.x > 0               // if first slide and sliding left
                    || index == slides.length - 1        // or if last slide and sliding right
                    && delta.x < 0                       // and if sliding at all
                  ) ?                      
                  ( Math.abs(delta.x) / width + 1 )      // determine resistance level
                  : 1 );                                 // no resistance if false
              
              // translate 1:1
              translate(index-1, delta.x + slidePos[index-1], 0);
              translate(index, delta.x + slidePos[index], 0);
              translate(index+1, delta.x + slidePos[index+1], 0);
            }

          }

        },
        end: function(event) {

          // measure duration
          var duration = +new Date - start.time;

          // determine if slide attempt triggers next/prev slide
          var isValidSlide = 
                Number(duration) < 250               // if slide duration is less than 250ms
                && Math.abs(delta.x) > 20            // and if slide amt is greater than 20px
                || Math.abs(delta.x) > width/2;      // or if slide amt is greater than half the width

          // determine if slide attempt is past start and end
          var isPastBounds = 
                !index && delta.x > 0                            // if first slide and slide amt is greater than 0
                || index == slides.length - 1 && delta.x < 0;    // or if last slide and slide amt is less than 0

          if (options.continuous) isPastBounds = false;
          
          // determine direction of swipe (true:right, false:left)
          var direction = delta.x < 0;

          // if not scrolling vertically
          if (!isScrolling) {

            if (isValidSlide && !isPastBounds) {

              if (direction) {

                if (options.continuous) { // we need to get the next in this direction in place

                  move(circle(index-1), -width, 0);
                  move(circle(index+2), width, 0);

                } else {
                  move(index-1, -width, 0);
                }

                move(index, slidePos[index]-width, speed);
                move(circle(index+1), slidePos[circle(index+1)]-width, speed);
                index = circle(index+1);  
                          
              } else {
                if (options.continuous) { // we need to get the next in this direction in place

                  move(circle(index+1), width, 0);
                  move(circle(index-2), -width, 0);

                } else {
                  move(index+1, width, 0);
                }

                move(index, slidePos[index]+width, speed);
                move(circle(index-1), slidePos[circle(index-1)]+width, speed);
                index = circle(index-1);

              }

              visibleThree(index, slides);
              options.callback && options.callback(index, slides[index]);

            } else {

              if (options.continuous) {

                move(circle(index-1), -width, speed);
                move(index, 0, speed);
                move(circle(index+1), width, speed);

              } else {

                move(index-1, -width, speed);
                move(index, 0, speed);
                move(index+1, width, speed);
              }

            }

          }

          // kill touchmove and touchend event listeners until touchstart called again
          element.removeEventListener('touchmove', events, false)
          element.removeEventListener('touchend', events, false)

        },
        transitionEnd: function(event) {

          if (parseInt(event.target.getAttribute('data-index'), 10) == index) {
            
            if (delay) begin();

            options.transitionEnd && options.transitionEnd.call(event, index, slides[index]);

          }

        }

      }

      // trigger setup
      setup();

      // start auto slideshow if applicable
      if (delay) begin();


      // add event listeners
      if (browser.addEventListener) {
        
        // set touchstart event on element    
        if (browser.touch) element.addEventListener('touchstart', events, false);

        if (browser.transitions) {
          element.addEventListener('webkitTransitionEnd', events, false);
          element.addEventListener('msTransitionEnd', events, false);
          element.addEventListener('oTransitionEnd', events, false);
          element.addEventListener('otransitionend', events, false);
          element.addEventListener('transitionend', events, false);
        }

        // set resize event on window
        window.addEventListener('resize', events, false);

      } else {

        window.onresize = function () { setup() }; // to play nice with old IE

      }

      // expose the Swipe API
      return {
        setup: function() {

          setup();

        },
        slide: function(to, speed) {
          
          // cancel slideshow
          stop();
          
          slide(to, speed);

        },
        prev: function() {

          // cancel slideshow
          stop();

          prev();

        },
        next: function() {

          // cancel slideshow
          stop();

          next();

        },
        getPos: function() {

          // return current index position
          return index + 1;

        },
        getNumSlides: function() {
          
          // return total number of slides
          return length;
        },
        kill: function() {

          // cancel slideshow
          stop();

          // reset element
          element.style.width = 'auto';
          element.style.left = 0;

          // reset slides
          var pos = slides.length;
          while(pos--) {

            var slide = slides[pos];
            slide.style.width = '100%';
            slide.style.left = 0;

            if (browser.transitions) translate(pos, 0, 0);

          }

          // removed event listeners
          if (browser.addEventListener) {

            // remove current event listeners
            element.removeEventListener('touchstart', events, false);
            element.removeEventListener('webkitTransitionEnd', events, false);
            element.removeEventListener('msTransitionEnd', events, false);
            element.removeEventListener('oTransitionEnd', events, false);
            element.removeEventListener('otransitionend', events, false);
            element.removeEventListener('transitionend', events, false);
            window.removeEventListener('resize', events, false);

          }
          else {

            window.onresize = null;

          }

        }
      }

    }

}
