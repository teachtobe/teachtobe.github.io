var lib = {
	randomInt:function(min, max) {
		if(min!=undefined && max!=undefined)
			return Math.floor(Math.random() * (max - min + 1) + min);
		else
			return Math.floor((Math.random()*100000000)+1);
	},
	//This works with hex: HHH, #HHH, HHHHHH, #HHHHHH
	color:{
		isDark: function(hex){
			var v = this.getV(hex);
			return v<75;
		},
		getV: function(hex){
			var rgb = this.hexToRgb(hex),
			r = rgb.r / 255,
			g = rgb.g / 255,
			b = rgb.b / 255;

			var v = Math.max(r, g, b);
			return Math.round(v*100)
		},
		hexToRgb: function(hex) {
		    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
		    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
		    	return r + r + g + g + b + b;
		    });

		    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		    return result ? {
		    	r: parseInt(result[1], 16),
		    	g: parseInt(result[2], 16),
		    	b: parseInt(result[3], 16)
		    } : null;
		},
		random:function(){
			return Math.floor(Math.random()*16777215).toString(16);
		}
	},
	isFullScreen:function() {
		return (window.navigator.standalone 
			|| (document.fullScreenElement && document.fullScreenElement !== null) 
			|| (document.mozFullScreen || document.webkitIsFullScreen) 
			|| (!window.screenTop && !window.screenY))
	}
}








function autofit(elem){
	var textSpan = $(elem).children('h2')[0];
	var textDiv = elem;

	console.log(textSpan,textDiv)
	it.textSpan = textSpan
	it.textDiv = textDiv

	var origSize = 50;
	$(textSpan).css('font-size', origSize+'px');

	console.log(textSpan.offsetHeight,textDiv.offsetHeight)
	while(textSpan.offsetHeight > (textDiv.offsetHeight-40)){
		var size = Number(window.getComputedStyle(textSpan, null).getPropertyValue('font-size').split('px')[0]);
		console.log('setting font-size: '+size)
		var newSize = parseInt(size) - 2;
		$(textSpan).css('font-size', newSize+'px');
	}
	$(textSpan).css('color', '#000');
}





Array.prototype.flat = function(col){
	return this.map(function(i){
		return i[col];
	})
}
Array.prototype.getUnique = function() {
	var u = {},
		a = [];
	for (var i = 0, l = this.length; i < l; ++i) {
		if (u.hasOwnProperty(this[i])) {
			continue;
		}
		a.push(this[i]);
		u[this[i]] = 1;
	}
	return a;
}
Array.prototype.unique = function(col){
	if(col)
		return this.flat(col).getUnique();
	else
		return this.getUnique();
}

Array.prototype.shuffle = function() {
	var i = this.length,
		j, temp;
	if (i == 0) return this;
	while (--i) {
		j = Math.floor(Math.random() * (i + 1));
		temp = this[i];
		this[i] = this[j];
		this[j] = temp;
	}
	return this;
}
Array.prototype.max = function() {
	return Math.max.apply(null, this);
};

Array.prototype.min = function() {
	return Math.min.apply(null, this);
};

String.prototype.toCamelCase = function() {
	var str = this.replace(/\s(.)/g, function($1) { return $1.toUpperCase(); })
		.replace(/\s/g, '')
		.replace(/^(.)/, function($1) { return $1.toLowerCase(); })
	return str.replace(/\W/g, '')
}

function elementPath(el) {
	var names = [];
	while (el.parentNode) {
		if (el.id) {
			names.unshift('#' + el.id);
			break;
		}
		else {
			if (el == el.ownerDocument.documentElement) names.unshift(el.tagName);
			else {
				for (var c = 1, e = el; e.previousElementSibling; e = e.previousElementSibling, c++);
				names.unshift(el.tagName + ":nth-child(" + c + ")");
			}
			el = el.parentNode;
		}
	}
	return names.join(" > ");
}