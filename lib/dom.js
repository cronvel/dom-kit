/*
	The Cedric's Swiss Knife (CSK) - CSK DOM toolbox

	Copyright (c) 2015 - 2016 Cédric Ronvel 
	
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



/* global NamedNodeMap */

// Load modules

var domParser , xmlSerializer ;

if ( process.browser )
{
	domParser = new DOMParser() ;
	xmlSerializer = new XMLSerializer() ;
}
else
{
	var xmldom = require( '@cronvel/xmldom' ) ;
	domParser = new xmldom.DOMParser() ;
	xmlSerializer = new xmldom.XMLSerializer() ;
}



var domKit = {} ;
module.exports = domKit ;



// Like jQuery's $(document).ready()
domKit.ready = function ready( callback )
{
	document.addEventListener( 'DOMContentLoaded' , function internalCallback() {
		document.removeEventListener( 'DOMContentLoaded' , internalCallback , false ) ;
		callback() ;
	} , false ) ;
} ;



domKit.fromXml = function fromXml( xml )
{
	return domParser.parseFromString( xml , 'application/xml' ) ;
} ;



domKit.toXml = function fromXml( $doc )
{
	return xmlSerializer.serializeToString( $doc ) ;
} ;



// Return a fragment from html code
domKit.fromHtml = function fromHtml( html )
{
	var i , $doc , $fragment ;
	
	// Fragment allow us to return a collection that... well... is not a collection,
	// and that's fine because the html code may contains multiple top-level element
	$fragment = document.createDocumentFragment() ;
	
	$doc = document.createElement( 'div' ) ;	// whatever type...
	
	// either .innerHTML or .insertAdjacentHTML()
	//$doc.innerHTML = html ;
	$doc.insertAdjacentHTML( 'beforeend' , html ) ;
	
	for ( i = 0 ; i < $doc.children.length ; i ++ )
	{
		$fragment.appendChild( $doc.children[ i ] ) ;
	}
	
	return $fragment ;
} ;



// Batch processing, like array, HTMLCollection, and so on...
domKit.batch = function batch( method , elements )
{
	var i , args = Array.prototype.slice.call( arguments , 1 ) ;
	
	if ( elements instanceof Element )
	{
		args[ 0 ] = elements ;
		method.apply( this , args ) ;
	}
	else if ( Array.isArray( elements ) )
	{
		for ( i = 0 ; i < elements.length ; i ++ )
		{
			args[ 0 ] = elements[ i ] ;
			method.apply( this , args ) ;
		}
	}
	else if ( elements instanceof NodeList || elements instanceof NamedNodeMap )
	{
		for ( i = 0 ; i < elements.length ; i ++ )
		{
			args[ 0 ] = elements[ i ] ;
			method.apply( this , args ) ;
		}
	}
} ;



// Set a bunch of css properties given as an object
domKit.css = function css( $element , object )
{
	var key ;
	
	for ( key in object )
	{
		$element.style[ key ] = object[ key ] ;
	}
} ;



// Set a bunch of attributes given as an object
domKit.attr = function attr( $element , object )
{
	var key ;
	
	for ( key in object )
	{
		if ( object[ key ] === null ) { $element.removeAttribute( key ) ; }
		else { $element.setAttribute( key , object[ key ] ) ; }
	}
} ;



// Set/unset a bunch of classes given as an object
domKit.class = function class_( $element , object )
{
	var key ;
	
	for ( key in object )
	{
		if ( object[ key ] ) { $element.classList.add( key ) ; }
		else { $element.classList.remove( key ) ; }
	}
} ;



// Remove an element. A little shortcut that ease life...
domKit.remove = function remove( $element ) { $element.parentNode.removeChild( $element ) ; } ;



// Remove all children of an element
domKit.empty = function empty( $element )
{
	// $element.innerHTML = '' ;	// <-- According to jsPerf, this is 96% slower
	while ( $element.firstChild ) { $element.removeChild( $element.firstChild ) ; }
} ;



// Clone a source DOM tree and replace children of the destination
domKit.cloneInto = function cloneInto( $source , $destination )
{
	domKit.empty( $destination ) ;
	$destination.appendChild( $source.cloneNode( true ) ) ;
} ;



// Same than cloneInto() without cloning anything
domKit.insertInto = function insertInto( $source , $destination )
{
	domKit.empty( $destination ) ;
	$destination.appendChild( $source ) ;
} ;



// Move all children of a node into another, after removing existing target's children
domKit.moveChildrenInto = function moveChildrenInto( $source , $destination )
{
	domKit.empty( $destination ) ;
	while ( $source.firstChild ) { $destination.appendChild( $source.firstChild ) ; }
} ;



// Move all attributes of an element into the destination
domKit.moveAttributes = function moveAttributes( $source , $destination )
{
	Array.from( $source.attributes ).forEach( function( attr ) {
		var name = attr.name ;
		var value = attr.value ;
		
		$source.removeAttribute( name ) ;
		
		// Do not copy namespaced attributes for instance,
		// should probably protect this behind a third argument
		if ( name !== 'xmlns' && name.indexOf( ':' ) === -1 && value )
		{
			//console.warn( 'moving: ' , name, value , $destination.getAttribute( name ) ) ;
			$destination.setAttribute( name , value ) ;
		}
	} ) ;
} ;



domKit.styleToAttribute = function styleToAttribute( $element , property , blacklistedValues )
{
	if ( $element.style[ property ] && ( ! blacklistedValues || blacklistedValues.indexOf( $element.style[ property ] ) === -1 ) )
	{
		$element.setAttribute( property , $element.style[ property ] ) ;
		$element.style[ property ] = null ;
	}
} ;



// Children of this element get all their ID prefixed, any url(#id) references are patched accordingly
domKit.prefixIds = function prefixIds( $element , prefix )
{
	var elements , replacement = {} ;
	
	elements = $element.querySelectorAll( '*' ) ;
	
	domKit.batch( domKit.prefixIds.idAttributePass , elements , prefix , replacement ) ;
	domKit.batch( domKit.prefixIds.otherAttributesPass , elements , replacement ) ;
} ;

// Callbacks for domKit.prefixIds(), cleanly hidden behind its prefix

domKit.prefixIds.idAttributePass = function idAttributePass( $element , prefix , replacement ) {
	replacement[ $element.id ] = prefix + '.' + $element.id ;
	$element.id = replacement[ $element.id ] ;
} ;

domKit.prefixIds.otherAttributesPass = function otherAttributesPass( $element , replacement ) {
	domKit.batch( domKit.prefixIds.oneAttributeSubPass , $element.attributes , replacement ) ;
} ;

domKit.prefixIds.oneAttributeSubPass = function oneAttributeSubPass( attr , replacement ) {
	
	// We have to search all url(#id) like substring in the current attribute's value
	attr.value = attr.value.replace( /url\(#([^)]+)\)/g , function( match , id ) {
		
		// No replacement? return the matched string
		if ( ! replacement[ id ] ) { return match ; }
		
		// Or return the replacement ID
		return 'url(#' + replacement[ id ] + ')' ;
	} ) ;
} ;



domKit.removeAllTags = function removeAllTags( $container , tagName , onlyIfEmpty )
{
	Array.from( $container.getElementsByTagName( tagName ) ).forEach( function( $element ) {
		if ( ! onlyIfEmpty || ! $element.firstChild ) { $element.parentNode.removeChild( $element ) ; }
	} ) ;
} ;



domKit.removeAllAttributes = function removeAllAttributes( $container , attrName )
{
	// Don't forget to remove the ID of the container itself
	$container.removeAttribute( attrName ) ;
	
	Array.from( $container.querySelectorAll( '[' + attrName + ']' ) ).forEach( function( $element ) {
		$element.removeAttribute( attrName ) ;
	} ) ;
} ;



domKit.preload = function preload( urls )
{
	if ( ! Array.isArray( urls ) ) { urls = [ urls ] ; }
	
	urls.forEach( function( url ) {
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
domKit.filterByNamespace = function filterByNamespace( $container , options )
{
	var i , $child , namespace , tagName , split ;
	
	// Nothing to do? return now...
	if ( ! options || typeof options !== 'object' ) { return ; }
	
	domKit.filterAttributesByNamespace( $container , options ) ;
	
	for ( i = $container.childNodes.length - 1 ; i >= 0 ; i -- )
	{
		$child = $container.childNodes[ i ] ;
		
		if ( $child.nodeType === 1 )
		{
			if ( $child.tagName.indexOf( ':' ) !== -1 )
			{
				split = $child.tagName.split( ':' ) ;
				namespace = split[ 0 ] ;
				tagName = split[ 1 ] ;
				
				if ( namespace === options.primary )
				{
					$child.tagName = tagName ;
					domKit.filterByNamespace( $child , options ) ;
				}
				else if ( options.whitelist )
				{
					if ( options.whitelist.indexOf( namespace ) !== -1 )
					{
						domKit.filterByNamespace( $child , options ) ;
					}
					else
					{
						$container.removeChild( $child ) ;
					}
				}
				else if ( options.blacklist )
				{
					if ( options.blacklist.indexOf( namespace ) !== -1 )
					{
						$container.removeChild( $child ) ;
					}
					else
					{
						domKit.filterByNamespace( $child , options ) ;
					}
				}
				else
				{
					domKit.filterByNamespace( $child , options ) ;
				}
			}
			else
			{
				domKit.filterByNamespace( $child , options ) ;
			}
		}
	}
} ;



// Filter attributes by namespace
domKit.filterAttributesByNamespace = function filterAttributesByNamespace( $container , options )
{
	var i , attr , namespace , attrName , value , split ;
	
	// Nothing to do? return now...
	if ( ! options || typeof options !== 'object' ) { return ; }
	
	for ( i = $container.attributes.length - 1 ; i >= 0 ; i -- )
	{
		attr = $container.attributes[ i ] ;
		
		if ( attr.name.indexOf( ':' ) !== -1 )
		{
			split = attr.name.split( ':' ) ;
			namespace = split[ 0 ] ;
			attrName = split[ 1 ] ;
			value = attr.value ;
			
			if ( namespace === options.primary )
			{
				$container.removeAttributeNode( attr ) ;
				$container.setAttribute( attrName , value ) ;
			}
			else if ( options.whitelist )
			{
				if ( options.whitelist.indexOf( namespace ) === -1 )
				{
					$container.removeAttributeNode( attr ) ;
				}
			}
			else if ( options.blacklist )
			{
				if ( options.blacklist.indexOf( namespace ) !== -1 )
				{
					$container.removeAttributeNode( attr ) ;
				}
			}
		}
	}
} ;



// Remove comments
domKit.removeComments = function removeComments( $container )
{
	var i , $child ;
	
	for ( i = $container.childNodes.length - 1 ; i >= 0 ; i -- )
	{
		$child = $container.childNodes[ i ] ;
		
		if ( $child.nodeType === 8 )
		{
			$container.removeChild( $child ) ;
		}
		else if ( $child.nodeType === 1 )
		{
			domKit.removeComments( $child ) ;
		}
	}
} ;



// Remove white-space-only text-node
domKit.removeWhiteSpaces = function removeWhiteSpaces( $container , onlyWhiteLines )
{
	var i , $child , $lastTextNode = null ;
	
	for ( i = $container.childNodes.length - 1 ; i >= 0 ; i -- )
	{
		$child = $container.childNodes[ i ] ;
		//console.log( '$child.nodeType' , $child.nodeType ) ;
		
		if ( $child.nodeType === 3 )
		{
			if ( onlyWhiteLines )
			{
				if ( $lastTextNode )
				{
					// When multiple text-node in a row
					$lastTextNode.nodeValue = ( $child.nodeValue + $lastTextNode.nodeValue ).replace( /^\s*(\n[\t ]*)$/ , '$1' ) ;
					$container.removeChild( $child ) ;
				}
				else
				{
					//console.log( "deb1: '" + $child.nodeValue + "'" ) ;
					$child.nodeValue = $child.nodeValue.replace( /^\s*(\n[\t ]*)$/ , '$1' ) ;
					$lastTextNode = $child ;
					//console.log( "deb2: '" + $child.nodeValue + "'" ) ;
				}
			}
			else
			{
				if ( ! /\S/.test( $child.nodeValue ) )
				{
					$container.removeChild( $child ) ;
				}
			}
		}
		else if ( $child.nodeType === 1 )
		{
			$lastTextNode = null ;
			domKit.removeWhiteSpaces( $child , onlyWhiteLines ) ;
		}
		else
		{
			$lastTextNode = null ;
		}
	}
} ;



// Transform-related method

domKit.parseMatrix = function parseMatrix( str )
{
	var matches = str.match( /(matrix|matrix3d)\(([0-9., -]+)\)/ ) ;
	
	if ( ! matches ) { return null ; }
	
	return matches[ 2 ].trim().split( / ?, ?/ ).map( function( e ) {
		return parseFloat( e ) ;
	} ) ;
} ;



domKit.decomposeMatrix = function decomposeMatrix( mat )
{
	if ( mat.length === 6 ) { return domKit.decomposeMatrix2d( mat ) ; }
	if ( mat.length === 16 ) { return domKit.decomposeMatrix3d( mat ) ; }
	else { return null ; }
} ;



// From: https://stackoverflow.com/questions/16359246/how-to-extract-position-rotation-and-scale-from-matrix-svg
domKit.decomposeMatrix2d = function decomposeMatrix2d( mat )
{
	var angle = Math.atan2( mat[1] , mat[0] ) ,
		denom = mat[0] * mat[0] + mat[1] * mat[1] ,
		scaleX = Math.sqrt( denom ) ,
		scaleY = ( mat[0] * mat[3] - mat[2] * mat[1] ) / scaleX ,
		skewX = Math.atan2( mat[0] * mat[2] + mat[1] * mat[3] , denom ) ;
	
	return {
		rotate: 180 * angle / Math.PI ,  // in degrees
		scaleX: scaleX ,
		scaleY: scaleY ,
		skewX: 180 * skewX / Math.PI ,  // in degree
		skewY: 0 ,  // always 0 in this decomposition
		translateX: mat[4] ,
		translateY: mat[5]
	} ;
} ;



// https://stackoverflow.com/questions/15024828/transforming-3d-matrix-into-readable-format
// supports only scale*rotate*translate matrix
domKit.decomposeMatrix3d = function decomposeMatrix3d( mat )
{
	var radians = Math.PI / 180 ;

	var sX = Math.sqrt( mat[0] * mat[0] + mat[1] * mat[1] + mat[2] * mat[2] ) ,
		sY = Math.sqrt( mat[4] * mat[4] + mat[5] * mat[5] + mat[6] * mat[6] ) ,
		sZ = Math.sqrt( mat[8] * mat[8] + mat[9] * mat[9] + mat[10] * mat[10] ) ;

	var rX = Math.atan2( - mat[9] / sZ , mat[10] / sZ ) / radians ,
		rY = Math.asin( mat[8] / sZ ) / radians ,
		rZ = Math.atan2( - mat[4] / sY , mat[0] / sX ) / radians ;

	if ( mat[4] === 1 || mat[4] === -1 )
	{
		rX = 0 ;
		rY = mat[4] * - Math.PI / 2 ;
		rZ = mat[4] * Math.atan2( mat[6] / sY , mat[5] / sY ) / radians ;
	}

	var tX = mat[12] / sX ,
		tY = mat[13] / sX ,
		tZ = mat[14] / sX ;
	
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



domKit.stringifyTransform = function stringifyTransform( object )
{
	var str = [] ;
	
	if ( object.translateX ) { str.push( 'translateX(' + object.translateX + 'px)' ) ; }
	if ( object.translateY ) { str.push( 'translateY(' + object.translateY + 'px)' ) ; }
	if ( object.translateZ ) { str.push( 'translateZ(' + object.translateZ + 'px)' ) ; }
	if ( object.rotate ) { str.push( 'rotate(' + object.rotate + 'deg)' ) ; }
	if ( object.rotateX ) { str.push( 'rotateX(' + object.rotateX + 'deg)' ) ; }
	if ( object.rotateY ) { str.push( 'rotateY(' + object.rotateY + 'deg)' ) ; }
	if ( object.rotateZ ) { str.push( 'rotateZ(' + object.rotateZ + 'deg)' ) ; }
	if ( object.scaleX ) { str.push( 'scaleX(' + object.scaleX + ')' ) ; }
	if ( object.scaleY ) { str.push( 'scaleY(' + object.scaleY + ')' ) ; }
	if ( object.scaleZ ) { str.push( 'scaleZ(' + object.scaleZ + ')' ) ; }
	if ( object.skewX ) { str.push( 'skewX(' + object.skewX + 'deg)' ) ; }
	if ( object.skewY ) { str.push( 'skewY(' + object.skewY + 'deg)' ) ; }
	
	return str.join( ' ' ) ;
} ;





		/* Function useful for .batch() as callback */
		/* ... to avoid defining again and again the same callback function */

// Change id
domKit.id = function id( $element , id ) { $element.id = id ; } ;

// Like jQuery .text().
domKit.text = function text( $element , text ) { $element.textContent = text ; } ;

// Like jQuery .html().
domKit.html = function html( $element , html ) { $element.innerHTML = html ; } ;


