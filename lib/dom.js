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



var dom = {} ;
module.exports = dom ;



// Like jQuery's $(document).ready()
dom.ready = function ready( callback )
{
	document.addEventListener( 'DOMContentLoaded' , function internalCallback() {
		document.removeEventListener( 'DOMContentLoaded' , internalCallback , false ) ;
		callback() ;
	} , false ) ;
} ;



dom.fromXml = function fromXml( xml )
{
	return domParser.parseFromString( xml , 'application/xml' ) ;
} ;



dom.toXml = function fromXml( $doc )
{
	return xmlSerializer.serializeToString( $doc ) ;
} ;



// Return a fragment from html code
dom.fromHtml = function fromHtml( html )
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
dom.batch = function batch( method , elements )
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
dom.css = function css( $element , object )
{
	var key ;
	
	for ( key in object )
	{
		$element.style[ key ] = object[ key ] ;
	}
} ;



// Set a bunch of attributes given as an object
dom.attr = function attr( $element , object )
{
	var key ;
	
	for ( key in object )
	{
		if ( object[ key ] === null ) { $element.removeAttribute( key ) ; }
		else { $element.setAttribute( key , object[ key ] ) ; }
	}
} ;



// Set/unset a bunch of classes given as an object
dom.class = function class_( $element , object )
{
	var key ;
	
	for ( key in object )
	{
		if ( object[ key ] ) { $element.classList.add( key ) ; }
		else { $element.classList.remove( key ) ; }
	}
} ;



// Remove an element. A little shortcut that ease life...
dom.remove = function remove( $element ) { $element.parentNode.removeChild( $element ) ; } ;



// Remove all children of an element
dom.empty = function empty( $element )
{
	// $element.innerHTML = '' ;	// <-- According to jsPerf, this is 96% slower
	while ( $element.firstChild ) { $element.removeChild( $element.firstChild ) ; }
} ;



// Clone a source DOM tree and replace children of the destination
dom.cloneInto = function cloneInto( $source , $destination )
{
	dom.empty( $destination ) ;
	$destination.appendChild( $source.cloneNode( true ) ) ;
} ;



// Same than cloneInto() without cloning anything
dom.insertInto = function insertInto( $source , $destination )
{
	dom.empty( $destination ) ;
	$destination.appendChild( $source ) ;
} ;



// Move all children of a node into another, after removing existing target's children
dom.moveChildrenInto = function moveChildrenInto( $source , $destination )
{
	dom.empty( $destination ) ;
	while ( $source.firstChild ) { $destination.appendChild( $source.firstChild ) ; }
} ;



// Children of this element get all their ID namespaced, any url(#id) references are patched accordingly
dom.idNamespace = function idNamespace( $element , namespace )
{
	var elements , replacement = {} ;
	
	elements = $element.querySelectorAll( '*' ) ;
	
	dom.batch( dom.idNamespace.idAttributePass , elements , namespace , replacement ) ;
	dom.batch( dom.idNamespace.otherAttributesPass , elements , replacement ) ;
} ;

// Callbacks for dom.idNamespace(), cleanly hidden behind its namespace

dom.idNamespace.idAttributePass = function idAttributePass( $element , namespace , replacement ) {
	replacement[ $element.id ] = namespace + '.' + $element.id ;
	$element.id = replacement[ $element.id ] ;
} ;

dom.idNamespace.otherAttributesPass = function otherAttributesPass( $element , replacement ) {
	dom.batch( dom.idNamespace.oneAttributeSubPass , $element.attributes , replacement ) ;
} ;

dom.idNamespace.oneAttributeSubPass = function oneAttributeSubPass( attr , replacement ) {
	
	// We have to search all url(#id) like substring in the current attribute's value
	attr.value = attr.value.replace( /url\(#([^)]+)\)/g , function( match , id ) {
		
		// No replacement? return the matched string
		if ( ! replacement[ id ] ) { return match ; }
		
		// Or return the replacement ID
		return 'url(#' + replacement[ id ] + ')' ;
	} ) ;
} ;



		/* Function useful for .batch() as callback */
		/* ... to avoid defining again and again the same callback function */

// Change id
dom.id = function id( $element , id ) { $element.id = id ; } ;

// Like jQuery .text().
dom.text = function text( $element , text ) { $element.textContent = text ; } ;

// Like jQuery .html().
dom.html = function html( $element , html ) { $element.innerHTML = html ; } ;


