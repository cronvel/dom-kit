/*
	Dom Kit

	Copyright (c) 2015 - 2018 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



var domParser , xmlSerializer ;

if ( process.browser ) {
	domParser = new DOMParser() ;
	xmlSerializer = new XMLSerializer() ;
}
else {
	var xmldom = require( '@cronvel/xmldom' ) ;
	domParser = new xmldom.DOMParser() ;
	xmlSerializer = new xmldom.XMLSerializer() ;
}



const domKit = {} ;
module.exports = domKit ;



// Like jQuery's $(document).ready()
domKit.ready = callback => {
	document.addEventListener( 'DOMContentLoaded' , function internalCallback() {
		document.removeEventListener( 'DOMContentLoaded' , internalCallback , false ) ;
		callback() ;
	} , false ) ;
} ;



domKit.fromXml = xml => domParser.parseFromString( xml , 'application/xml' ) ;
domKit.toXml = $doc => xmlSerializer.serializeToString( $doc ) ;



// Return a fragment from html code
domKit.fromHtml = html => {
	var i , $doc , $fragment ;

	// Fragment allow us to return a collection that... well... is not a collection,
	// and that's fine because the html code may contains multiple top-level element
	$fragment = document.createDocumentFragment() ;

	$doc = document.createElement( 'div' ) ;	// whatever type...

	// either .innerHTML or .insertAdjacentHTML()
	//$doc.innerHTML = html ;
	$doc.insertAdjacentHTML( 'beforeend' , html ) ;

	for ( i = 0 ; i < $doc.children.length ; i ++ ) {
		$fragment.appendChild( $doc.children[ i ] ) ;
	}

	return $fragment ;
} ;



// Add a JS script, return a promise when done
domKit.addJsScript = ( url , $element = document.body ) => {
	return new Promise( ( resolve , reject ) => {
		var $script = document.createElement( 'script' ) ;
		$script.src = url ;
		$script.async = true ;
		$script.onload = resolve ;
		$script.onerror = reject ;
		$element.appendChild( $script ) ;
	} ) ;
} ;


// Batch processing, like array, HTMLCollection, and so on...
domKit.batch = ( method , elements , ... args ) => {
	var i ;

	if ( elements instanceof Element ) {
		method( elements , ... args ) ;
	}
	else if ( Array.isArray( elements ) ) {
		for ( i = 0 ; i < elements.length ; i ++ ) {
			method( elements[ i ] , ... args ) ;
		}
	}
	else if ( elements instanceof NodeList || elements instanceof NamedNodeMap ) {
		for ( i = 0 ; i < elements.length ; i ++ ) {
			method( elements[ i ] , ... args ) ;
		}
	}
} ;



// Set a bunch of css properties given as an object
domKit.css = ( $element , object ) => {
	var key ;

	for ( key in object ) {
		$element.style[ key ] = object[ key ] ;
	}
} ;



// Set a bunch of attributes given as an object
domKit.attr = ( $element , object , prefix ) => {
	var key ;

	prefix = prefix || '' ;

	for ( key in object ) {
		if ( object[ key ] === null ) { $element.removeAttribute( prefix + key ) ; }
		else { $element.setAttribute( prefix + key , object[ key ] ) ; }
	}
} ;



// Set/unset a bunch of classes given as an object
domKit.class = ( $element , object , prefix ) => {
	var key ;

	prefix = prefix || '' ;

	for ( key in object ) {
		if ( object[ key ] ) { $element.classList.add( prefix + key ) ; }
		else { $element.classList.remove( prefix + key ) ; }
	}
} ;



// Remove an element. A little shortcut that ease life...
domKit.remove = $element => $element.parentNode.removeChild( $element ) ;



// Remove all children of an element
domKit.empty = $element => {
	// $element.innerHTML = '' ;	// <-- According to jsPerf, this is 96% slower
	while ( $element.firstChild ) { $element.removeChild( $element.firstChild ) ; }
} ;



// Clone a source DOM tree and replace children of the destination
domKit.cloneInto = ( $source , $destination ) => {
	domKit.empty( $destination ) ;
	$destination.appendChild( $source.cloneNode( true ) ) ;
} ;



// Same than cloneInto() without cloning anything
domKit.insertInto = ( $source , $destination ) => {
	domKit.empty( $destination ) ;
	$destination.appendChild( $source ) ;
} ;



// Move all children of a node into another, after removing existing target's children
domKit.moveChildrenInto = ( $source , $destination ) => {
	domKit.empty( $destination ) ;
	while ( $source.firstChild ) { $destination.appendChild( $source.firstChild ) ; }
} ;



// Move all attributes of an element into the destination
domKit.moveAttributes = ( $source , $destination ) => {
	Array.from( $source.attributes ).forEach( ( attr ) => {
		var name = attr.name ;
		var value = attr.value ;

		$source.removeAttribute( name ) ;

		// Do not copy namespaced attributes for instance,
		// should probably protect this behind a third argument
		if ( name !== 'xmlns' && name.indexOf( ':' ) === -1 && value ) {
			//console.warn( 'moving: ' , name, value , $destination.getAttribute( name ) ) ;
			$destination.setAttribute( name , value ) ;
		}
	} ) ;
} ;



domKit.styleToAttribute = ( $element , property , blacklistedValues ) => {
	if ( $element.style[ property ] && ( ! blacklistedValues || blacklistedValues.indexOf( $element.style[ property ] ) === -1 ) ) {
		$element.setAttribute( property , $element.style[ property ] ) ;
		$element.style[ property ] = null ;
	}
} ;



// Children of this element get all their ID prefixed, any url(#id) references are patched accordingly
domKit.prefixIds = ( $element , prefix ) => {
	var elements , replacement = {} ;

	elements = $element.querySelectorAll( '*' ) ;

	domKit.batch( domKit.prefixIds.idAttributePass , elements , prefix , replacement ) ;
	domKit.batch( domKit.prefixIds.otherAttributesPass , elements , replacement ) ;
} ;



// Callbacks for domKit.prefixIds(), cleanly hidden behind its prefix

domKit.prefixIds.idAttributePass = ( $element , prefix , replacement ) => {
	replacement[ $element.id ] = prefix + '.' + $element.id ;
	$element.id = replacement[ $element.id ] ;
} ;



domKit.prefixIds.otherAttributesPass = ( $element , replacement ) => {
	domKit.batch( domKit.prefixIds.oneAttributeSubPass , $element.attributes , replacement ) ;
} ;



domKit.prefixIds.oneAttributeSubPass = ( attr , replacement ) => {
	// We have to search all url(#id) like substring in the current attribute's value
	attr.value = attr.value.replace( /url\(#([^)]+)\)/g , ( match , id ) => {

		// No replacement? return the matched string
		if ( ! replacement[ id ] ) { return match ; }

		// Or return the replacement ID
		return 'url(#' + replacement[ id ] + ')' ;
	} ) ;
} ;



domKit.removeAllTags = ( $container , tagName , onlyIfEmpty ) => {
	Array.from( $container.getElementsByTagName( tagName ) ).forEach( ( $element ) => {
		if ( ! onlyIfEmpty || ! $element.firstChild ) { $element.parentNode.removeChild( $element ) ; }
	} ) ;
} ;



domKit.removeAllAttributes = ( $container , attrName ) => {
	// Don't forget to remove the ID of the container itself
	$container.removeAttribute( attrName ) ;

	Array.from( $container.querySelectorAll( '[' + attrName + ']' ) ).forEach( ( $element ) => {
		$element.removeAttribute( attrName ) ;
	} ) ;
} ;



domKit.preload = urls => {
	if ( ! Array.isArray( urls ) ) { urls = [ urls ] ; }

	urls.forEach( ( url ) => {
		if ( domKit.preload.preloaded[ url ] ) { return ; }
		domKit.preload.preloaded[ url ] = new Image() ;
		domKit.preload.preloaded[ url ].src = url ;
	} ) ;
} ;

domKit.preload.preloaded = {} ;



/*
	Filter namespaces:

	* options `object` where:
		* blacklist `array` of `string` namespace of elements/attributes to remove
		* whitelist `array` of `string` namespace to elements/attributes to keep
		* primary `string` keep those elements but remove the namespace
*/
domKit.filterByNamespace = ( $container , options ) => {
	var i , $child , namespace , tagName , split ;

	// Nothing to do? return now...
	if ( ! options || typeof options !== 'object' ) { return ; }

	domKit.filterAttributesByNamespace( $container , options ) ;

	for ( i = $container.childNodes.length - 1 ; i >= 0 ; i -- ) {
		$child = $container.childNodes[ i ] ;

		if ( $child.nodeType === 1 ) {
			if ( $child.tagName.indexOf( ':' ) !== -1 ) {
				split = $child.tagName.split( ':' ) ;
				namespace = split[ 0 ] ;
				tagName = split[ 1 ] ;

				if ( namespace === options.primary ) {
					$child.tagName = tagName ;
					domKit.filterByNamespace( $child , options ) ;
				}
				else if ( options.whitelist ) {
					if ( options.whitelist.indexOf( namespace ) !== -1 ) {
						domKit.filterByNamespace( $child , options ) ;
					}
					else {
						$container.removeChild( $child ) ;
					}
				}
				else if ( options.blacklist ) {
					if ( options.blacklist.indexOf( namespace ) !== -1 ) {
						$container.removeChild( $child ) ;
					}
					else {
						domKit.filterByNamespace( $child , options ) ;
					}
				}
				else {
					domKit.filterByNamespace( $child , options ) ;
				}
			}
			else {
				domKit.filterByNamespace( $child , options ) ;
			}
		}
	}
} ;



// Filter attributes by namespace
domKit.filterAttributesByNamespace = ( $container , options ) => {
	var i , attr , namespace , attrName , value , split ;

	// Nothing to do? return now...
	if ( ! options || typeof options !== 'object' ) { return ; }

	for ( i = $container.attributes.length - 1 ; i >= 0 ; i -- ) {
		attr = $container.attributes[ i ] ;

		if ( attr.name.indexOf( ':' ) !== -1 ) {
			split = attr.name.split( ':' ) ;
			namespace = split[ 0 ] ;
			attrName = split[ 1 ] ;
			value = attr.value ;

			if ( namespace === options.primary ) {
				$container.removeAttributeNode( attr ) ;
				$container.setAttribute( attrName , value ) ;
			}
			else if ( options.whitelist ) {
				if ( options.whitelist.indexOf( namespace ) === -1 ) {
					$container.removeAttributeNode( attr ) ;
				}
			}
			else if ( options.blacklist ) {
				if ( options.blacklist.indexOf( namespace ) !== -1 ) {
					$container.removeAttributeNode( attr ) ;
				}
			}
		}
	}
} ;



// Remove comments
domKit.removeComments = $container => {
	var i , $child ;

	for ( i = $container.childNodes.length - 1 ; i >= 0 ; i -- ) {
		$child = $container.childNodes[ i ] ;

		if ( $child.nodeType === 8 ) {
			$container.removeChild( $child ) ;
		}
		else if ( $child.nodeType === 1 ) {
			domKit.removeComments( $child ) ;
		}
	}
} ;



// Remove white-space-only text-node
domKit.removeWhiteSpaces = ( $container , onlyWhiteLines ) => {
	var i , $child , $lastTextNode = null ;

	for ( i = $container.childNodes.length - 1 ; i >= 0 ; i -- ) {
		$child = $container.childNodes[ i ] ;
		//console.log( '$child.nodeType' , $child.nodeType ) ;

		if ( $child.nodeType === 3 ) {
			if ( onlyWhiteLines ) {
				if ( $lastTextNode ) {
					// When multiple text-node in a row
					$lastTextNode.nodeValue = ( $child.nodeValue + $lastTextNode.nodeValue ).replace( /^\s*(\n[\t ]*)$/ , '$1' ) ;
					$container.removeChild( $child ) ;
				}
				else {
					//console.log( "deb1: '" + $child.nodeValue + "'" ) ;
					$child.nodeValue = $child.nodeValue.replace( /^\s*(\n[\t ]*)$/ , '$1' ) ;
					$lastTextNode = $child ;
					//console.log( "deb2: '" + $child.nodeValue + "'" ) ;
				}
			}
			else if ( ! /\S/.test( $child.nodeValue ) ) {
				$container.removeChild( $child ) ;
			}
		}
		else if ( $child.nodeType === 1 ) {
			$lastTextNode = null ;
			domKit.removeWhiteSpaces( $child , onlyWhiteLines ) ;
		}
		else {
			$lastTextNode = null ;
		}
	}
} ;



// Transform-related method

domKit.parseMatrix = str => {
	var matches = str.match( /(matrix|matrix3d)\(([0-9., -]+)\)/ ) ;

	if ( ! matches ) { return null ; }

	return matches[ 2 ].trim().split( / ?, ?/ ).map( ( e ) => {
		return parseFloat( e ) ;
	} ) ;
} ;



domKit.decomposeMatrix = matrix => {
	if ( matrix.length === 6 ) { return domKit.decomposeMatrix2d( matrix ) ; }
	if ( matrix.length === 16 ) { return domKit.decomposeMatrix3d( matrix ) ; }
	return null ;
} ;



// From: https://stackoverflow.com/questions/16359246/how-to-extract-position-rotation-and-scale-from-matrix-svg
domKit.decomposeMatrix2d = matrix => {
	var angle = Math.atan2( matrix[1] , matrix[0] ) ,
		denom = matrix[0] * matrix[0] + matrix[1] * matrix[1] ,
		scaleX = Math.sqrt( denom ) ,
		scaleY = ( matrix[0] * matrix[3] - matrix[2] * matrix[1] ) / scaleX ,
		skewX = Math.atan2( matrix[0] * matrix[2] + matrix[1] * matrix[3] , denom ) ;

	return {
		rotate: 180 * angle / Math.PI ,  // in degrees
		scaleX: scaleX ,
		scaleY: scaleY ,
		skewX: 180 * skewX / Math.PI ,  // in degree
		skewY: 0 ,  // always 0 in this decomposition
		translateX: matrix[4] ,
		translateY: matrix[5]
	} ;
} ;



// https://stackoverflow.com/questions/15024828/transforming-3d-matrix-into-readable-format
// supports only scale*rotate*translate matrix
domKit.decomposeMatrix3d = matrix => {
	var radians = Math.PI / 180 ;

	var sX = Math.sqrt( matrix[0] * matrix[0] + matrix[1] * matrix[1] + matrix[2] * matrix[2] ) ,
		sY = Math.sqrt( matrix[4] * matrix[4] + matrix[5] * matrix[5] + matrix[6] * matrix[6] ) ,
		sZ = Math.sqrt( matrix[8] * matrix[8] + matrix[9] * matrix[9] + matrix[10] * matrix[10] ) ;

	var rX = Math.atan2( -matrix[9] / sZ , matrix[10] / sZ ) / radians ,
		rY = Math.asin( matrix[8] / sZ ) / radians ,
		rZ = Math.atan2( -matrix[4] / sY , matrix[0] / sX ) / radians ;

	if ( matrix[4] === 1 || matrix[4] === -1 ) {
		rX = 0 ;
		rY = matrix[4] * -Math.PI / 2 ;
		rZ = matrix[4] * Math.atan2( matrix[6] / sY , matrix[5] / sY ) / radians ;
	}

	var tX = matrix[12] / sX ,
		tY = matrix[13] / sX ,
		tZ = matrix[14] / sX ;

	return {
		translateX: tX ,
		translateY: tY ,
		translateZ: tZ ,
		rotateX: rX ,
		rotateY: rY ,
		rotateZ: rZ ,
		scaleX: sX ,
		scaleY: sY ,
		scaleZ: sZ
	} ;
} ;



domKit.stringifyTransform = object => {
	var str = [] ;

	if ( object.translateX ) { str.push( 'translateX(' + object.translateX + 'px)' ) ; }
	if ( object.translateY ) { str.push( 'translateY(' + object.translateY + 'px)' ) ; }
	if ( object.translateZ ) { str.push( 'translateZ(' + object.translateZ + 'px)' ) ; }

	if ( object.rotate ) {
		str.push( 'rotate(' + object.rotate + 'deg)' ) ;
	}
	else {
		if ( object.rotateX ) { str.push( 'rotateX(' + object.rotateX + 'deg)' ) ; }
		if ( object.rotateY ) { str.push( 'rotateY(' + object.rotateY + 'deg)' ) ; }
		if ( object.rotateZ ) { str.push( 'rotateZ(' + object.rotateZ + 'deg)' ) ; }
	}

	if ( object.scale ) {
		str.push( 'scale(' + object.scale + ')' ) ;
	}
	else {
		if ( object.scaleX ) { str.push( 'scaleX(' + object.scaleX + ')' ) ; }
		if ( object.scaleY ) { str.push( 'scaleY(' + object.scaleY + ')' ) ; }
		if ( object.scaleZ ) { str.push( 'scaleZ(' + object.scaleZ + ')' ) ; }
	}

	if ( object.skewX ) { str.push( 'skewX(' + object.skewX + 'deg)' ) ; }
	if ( object.skewY ) { str.push( 'skewY(' + object.skewY + 'deg)' ) ; }

	return str.join( ' ' ) ;
} ;

domKit.transform = ( $element , transformObject ) => $element.style.transform = domKit.stringifyTransform( transformObject ) ;





/* Function useful for .batch() as callback */
/* ... to avoid defining again and again the same callback function */

// Change id
domKit.id = ( $element , id ) => $element.id = id ;

// Like jQuery .text().
domKit.text = ( $element , text ) => $element.textContent = text ;

// Like jQuery .html().
domKit.html = ( $element , html ) => $element.innerHTML = html ;

