/**
 * Project: jQuery "Typer" Plugin
 * Author: Derija
 * Date: 18.06.12
 * Time: 12:35
 *
 * The Typer is a little extension for jQuery that will create a fully customizable input element by
 * using a normal div element to fake the input. It supports handy little functions to extend your
 * pseudo-editor, (auto-)markup parts of the input text, add buttons to replace or wrap text around
 * selected text, and more!
 * A powerful little tool with an easy usage.
 *
 * @todo Implement custom replacement support. Remember: replacement object looks like this: { what : 'text', with : 'other text', wrap : true }
 */

"use strict";

(function($){
    var Selection = $('<span id="selection"></span>'),
        Caret = $('<span id="caret"></span>').data('interval', -1)
            .css({
                display : 'inline-block',
                width : 1,
                height : '1em',
                marginRight : -1,
                background : 'black'
            });

    $.fn.typer = function( task, options ) {
        if( arguments.length < 2 && typeof task == 'object') {
            options = task;
            task = undefined;
        }

        if( typeof task == 'undefined' ) {
            task = 'create';
        }

        // Make sure options are an object.
        options = typeof options == 'object' ? options : {};

        switch( task ) {
            case 'create':
                this.each(function( index, elem ) {
                    var Typer, Input;

                    // If the element is an input field, we'll create
                    // a replacement element that will display our
                    // input. This preserves form functionality.
                    if( elem.nodeName.toLowerCase() == 'input' ||
                        elem.nodeName.toLowerCase() == 'textarea' )
                    {
                        Input = $(elem);
                        Typer = $('<div></div>')
                            .insertAfter(Input);
                    }

                    // Else we'll need to create an input element
                    // and don't care about form functionality.
                    else
                    {
                        Typer = $(elem);
                        Input = $('<textarea></textarea>')
                            .appendTo(document.body);
                    }

                    Typer.data('input', Input);
                    Input.data('typer', Typer)
                        .css({
                            position : 'fixed',
                            top : -50000,
                            left : -50000,
                            width : '100%'
                        });

                    // Apply customizations.
                    if( !!options.initText )
                        Typer.html(options.initText);
                    if( !!options.wrapper )
                        Typer.wrap(options.wrapper);
                    if( !!options.class )
                        Typer.addClass(options.class);
                    if( !!options.inputId )
                        Input.attr('id', options.inputId);

                    Typer
                        .data('typer', true)
                        .data('text', '')
                        .click(function( ) {
                            Input.focus();
                            Typer.addClass('focus');
                        });

                    Input
                        .focus(function( jqEvt ) {
                            if( $.trim(Typer.data('text')).length == 0 )
                                Typer
                                    .data('initText', Typer.html())
                                    .html('')
                                    .data('text', '');
                            Input.val(Typer.data('text'));
                        })
                        .blur(function( jqEvt ) {
                            if( $.trim(Typer.data('text')).length == 0 ) {
                                Typer
                                    .html(Typer.data('initText'))
                                    .data('text', '');
                                Input.val('');
                            }
                            Typer.removeClass('focus');
                            Caret.remove();
                        })
                        // Registers key strokes the fastest.
                        .keydown(function( jqEvt ) {
                            StopCaretFlash();

                            // Input is actually registered TOO fast.
                            window.setTimeout(
                                function( ) {
                                    var selection = Input.getSelection(),
                                        text = Input.val(),
                                        preSelection = TyperEscape(Typer, text.substr(
                                            0,
                                            selection.start
                                        )),
                                        postSelection = TyperEscape(Typer, text.substr(
                                            selection.end
                                        )),
                                        caretLeft = true;
                                    Selection.html(TyperEscape(Typer, selection.text));

                                    Typer.data('text', text);

                                    if( Input.data('prevSel') ) {
                                        caretLeft = selection.start - Input.data('prevSel').start < 0;
                                    }

                                    Typer.empty().append(preSelection);
                                    if( caretLeft )
                                        Typer.append(Caret);
                                    Typer.append(Selection);
                                    if( !caretLeft )
                                        Typer.append(Caret);
                                    Typer.append(postSelection);
                                },
                                1
                            );
                        })
                        .keyup(function( jqEvt ) {
                            StartCaretFlash();
                        });
                });
                break;

            case 'button': // Add a button!
                if( !options.elem || !options.func )
                    break;

                var Button = $(options.elem)
                    .data('wrap', !!options.wrap)
                    .data('func', options.func)
                    .click(function( jqEvt ) {
                        jqEvt.preventDefault();
                    });
                break;
        }

        return this;
    };

    /**
     * For all the things that we need to replace in order to make it pretty much XSS safe(r)...
     * @param {Object} typer The typer object to perform additional replacements.
     * @param {String} text The input string which we need to escape.
     * @return {String}
     * @constructor
     */
    function TyperEscape( typer, text ) {
        text = text
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&apos;')
            .replace(/"/g, '&quot;')
            .replace(/`/g, '&#96;')
            .replace(/\r?\n/g, '<br />');

        // Custom replacements support. Pretty much used for buttons...
        var replacements = $(typer).data('typer.replacements');
        if( $.isArray(replacements) ) {
            for( var i = 0; i < replacements.length; ++i ) {
                var replacement = replacements[i];
                text = text.replace( new RegExp(replacement.what, 'g'), replacement.wrap ? $(replacement.with).text(replacement.what).html() : replacement.with);
            }
        }
        return text;
    }

    /**
     * If the caret isn't already flashing, make it flash!
     */
    function StartCaretFlash( ) {
        // If the caret is already flashing, forget about this...
        console.log(Caret.data('interval'));
        if( typeof Caret.data('interval') != 'undefined' )
            return;

        // Else make it flash. ;)
        Caret.data('interval', setInterval(function() {
            var flashing = !!Caret.data('flashing');
            Caret.css('background', flashing ? 'black' : 'transparent')
                .data('flashing', !flashing);
        }, 600));
    }

    /**
     * If the caret hasn't already stopped, make it stop! Make sure it's visible though...
     */
    function StopCaretFlash( ) {
        if( typeof Caret.data('interval') == 'undefined' )
            return;
        clearInterval(Caret.data('interval'));
        Caret.css('background', 'black');
    }
})(window.jQuery);