/*
	The Cedric's Swiss Knife (CSK) - CSK DOM toolbox

	Copyright (c) 2015 Cédric Ronvel 
	
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



// Load modules
var fs = require( 'fs' ) ;
//var string = require( 'string-kit' ) ;



var svgLoader = {} ;
module.exports = svgLoader ;



/*
	load( container , url , [options] , callback )
*/
svgLoader.load = function load( container , url , options , callback )
{
	if ( typeof options === 'function' ) { callback = options ; }
	if ( ! options || typeof options !== 'object' ) { options = {} ; }
	
	if ( url.substring( 0 , 7 ) === 'file://' )
	{
		// Use Node.js 'fs' module
		
		fs.readFile( url.slice( 7 ) , function( error , content ) {
			
			if ( error ) { callback( error ) ; return ; }
			
			var parser = new DOMParser() ;
			var svg = parser.parseFromString( content.toString() , 'application/xml' ).documentElement ;
			
			try {
				svgLoader.attachXmlTo( container , svg , options ) ;
			}
			catch ( error ) {
				callback( error ) ;
				return ;
			}
			
			callback( undefined , svg ) ;
		} ) ;
	}
	else
	{
		// Use an AJAX HTTP Request
		
		svgLoader.ajax( url , function( error , xmlDoc ) {
			
			var svg = xmlDoc.documentElement ;
			
			if ( error ) { callback( error ) ; return ; }
			
			try {
				svgLoader.attachXmlTo( container , svg , options ) ;
			}
			catch ( error ) {
				callback( error ) ;
				return ;
			}
			
			callback( undefined , svg ) ;
		} ) ;
	}
} ;



// Dummy ATM...
svgLoader.attachXmlTo = function attachXmlTo( container , svg , options )
{
	svgLoader.lightCleanup( svg ) ;
	
	// Fix id, if necessary
	if ( options.id !== undefined )
	{
		if ( typeof options.id === 'string' ) { svg.setAttribute( 'id' , options.id ) ; }
		else if ( ! options.id ) { svg.removeAttribute( 'id' ) ; }
	}
	
	//if ( typeof options.class === 'string' ) { svg.classList.add( options.class ) ; }	// like jQuery .addClass()
	if ( typeof options.class === 'string' ) { svg.setAttribute( 'class' , options.class ) ; }
	
	container.appendChild( svg ) ;
} ;



svgLoader.lightCleanup = function lightCleanup( svgElement )
{
	removeAllTag( svgElement , 'metadata' ) ;
	removeAllTag( svgElement , 'script' ) ;
} ;



// Should remove all tags and attributes that have non-registered namespace,
// e.g.: sodipodi, inkscape, etc...
//svgLoader.heavyCleanup = function heavyCleanup( svgElement ) {} ;



function removeAllTag( container , tag )
{
	var i , elements , element ;
	
	elements = container.getElementsByTagName( tag ) ;
	
	for ( i = 0 ; i < elements.length ; i ++ )
	{
		element = elements.item( i ) ;
		element.parentNode.removeChild( element ) ;
	}
}



svgLoader.setAttribute = function( node , attrList )
{
	var key ;
	
	for ( key in attrList )
	{
		// Should we use a method to transform camelCase into camel-case?
		// key = string.camelCaseToDash( key ) ;
		node.setAttribute( key , attrList[ key ] ) ;
	}
} ;



svgLoader.ajax = function ajax( url , callback )
{
	var xhr = new XMLHttpRequest() ;
	
	xhr.responseType = 'document' ;
	xhr.onreadystatechange = ajaxStatus.bind( xhr , callback ) ;
	xhr.open( 'GET', url ) ;
	xhr.send() ;
} ;



function ajaxStatus( callback )
{
	// From MDN: In the event of a communication error (such as the webserver going down),
	// an exception will be thrown in the when attempting to access the 'status' property. 
	
	try {
		if ( this.readyState === 4 )
		{
			if ( this.status === 200 )
			{
				callback( undefined , this.responseXML ) ;
			}
			else if ( this.status === 0 && this.responseXML )	// Yay, loading with file:// does not provide any status...
			{
				callback( undefined , this.responseXML ) ;
			}
			else
			{
				if ( this.status ) { callback( this.status ) ; }
				else { callback( new Error( "[svgLoader] ajaxStatus(): Error with falsy status" ) ) ; }
			}
		}
	}
	catch ( error ) {
		callback( error ) ;
	}
}

