/**
 * Project: jQuery "OnInsert" Plugin
 * Author: Derija
 * Date: 18.06.12
 * Time: 15:20
 *
 * Micro-library that adds the new event "onInsert" triggered for every element inserted into the document.
 * May be extended to detect completely new elements, but the way jQuery uses Elements makes it really
 * difficult to find a perfect solution...
 */

(function($){
    if( typeof Node != 'function' ) {
        console.log( '[jQuery.onInsert] I don\'t know what kind of browser you\'re using, but it does not support the Node object?!' );
        return;
    }

    // For appended nodes...
    Node.prototype.appendChild_old = Node.prototype.appendChild;
    Node.prototype.appendChild = function( target ) {
        var before, after;

        before = $(document).find(target).length > 0;
        Node.prototype.appendChild_old.apply(this, arguments);
        after = $(document).find(target).length > 0;

        if( !before && after ) {
            var jqEvt = jQuery.Event('insert');
            $(target).trigger(jqEvt);
        }
    };

    // For inserted nodes...
    Node.prototype.insertBefore_old = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function( target ) {
        var before, after;

        before = $(document).find(target).length > 0;
        Node.prototype.insertBefore_old.apply(this, arguments);
        after = $(document).find(target).length > 0;

        if( !before && after ) {
            var jqEvt = jQuery.Event('insert');
            $(target).trigger(jqEvt);
        }
    };
})(window.jQuery);