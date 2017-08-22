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



// Children of this element get all their ID namespaced, any url(#id) references are patched accordingly
domKit.prefixIds = function prefixIds( $element , namespace )
{
	var elements , replacement = {} ;
	
	elements = $element.querySelectorAll( '*' ) ;
	
	domKit.batch( domKit.prefixIds.idAttributePass , elements , namespace , replacement ) ;
	domKit.batch( domKit.prefixIds.otherAttributesPass , elements , replacement ) ;
} ;

// Callbacks for domKit.prefixIds(), cleanly hidden behind its namespace

domKit.prefixIds.idAttributePass = function idAttributePass( $element , namespace , replacement ) {
	replacement[ $element.id ] = namespace + '.' + $element.id ;
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



domKit.removeAllTags = function removeAllTags( $container , tag , onlyIfEmpty )
{
	Array.from( $container.getElementsByTagName( tag ) ).forEach( function( $element ) {
		if ( ! onlyIfEmpty || ! $element.firstChild ) { $element.parentNode.removeChild( $element ) ; }
	} ) ;
} ;



domKit.removeAllAttributes = function removeAllAttributes( $container , attr )
{
	// Don't forget to remove the ID of the container itself
	$container.removeAttribute( attr ) ;
	
	Array.from( $container.querySelectorAll( '[' + attr + ']' ) ).forEach( function( $element ) {
		$element.removeAttribute( attr ) ;
	} ) ;
} ;



		/* Function useful for .batch() as callback */
		/* ... to avoid defining again and again the same callback function */

// Change id
domKit.id = function id( $element , id ) { $element.id = id ; } ;

// Like jQuery .text().
domKit.text = function text( $element , text ) { $element.textContent = text ; } ;

// Like jQuery .html().
domKit.html = function html( $element , html ) { $element.innerHTML = html ; } ;


