( function( tinymce ) {

    tinymce.ui.TinyMCETermsInput = tinymce.ui.Control.extend( {
        renderHtml: function() {
            return (
                '<div id="' + this._id + '" class="wp-link-input">' +
                    '<p>' + mceDemo.taxonomies + '</p>' +
                '</div>'
            );
        }
    } );

    tinymce.PluginManager.add( 'TinyMCE_Terms', function( editor ) {
        var toolbar;
        var editToolbar;
        var linkNode;
        var $ = window.jQuery;

        function getSelectedLink() {
            var href, html,
                node = editor.selection.getNode(),
                link = editor.dom.getParent( node, 'a[href]' );

            if ( ! link ) {
                html = editor.selection.getContent({ format: 'raw' });

                if ( html && html.indexOf( '</a>' ) !== -1 ) {
                    href = html.match( /href="([^">]+)"/ );

                    if ( href && href[1] ) {
                        link = editor.$( 'a[href="' + href[1] + '"]', node )[0];
                    }

                    if ( link ) {
                        editor.selection.select( link );
                    }
                }
            }

            return link;
        }

        function removePlaceholders() {
            editor.$( 'a' ).each( function( i, element ) {
                var $element = editor.$( element );

                // if placeholder link, remove entirely
                if ( $element.attr( 'href' ) === '_term_placeholder' ) {
                    editor.dom.remove( element, true );

                // if editing existing, just remove edit-status
                } else if ( $element.attr( 'data-tinymceterms-edit' ) ) {
                    $element.attr( 'data-tinymceterms-edit', null );
                }
            });
        }

        function removePlaceholderStrings( content, dataAttr ) {
            return content.replace( /(<a [^>]+>)([\s\S]*?)<\/a>/g, function( all, tag, text ) {
                if ( tag.indexOf( ' href="_term_placeholder"' ) > -1 ) {
                    return text;
                }

                if ( dataAttr ) {
                    tag = tag.replace( / data-tinymceterms-edit="true"/g, '' );
                }

                return tag + text + '</a>';
            });
        }

        editor.on( 'preinit', function() {
            if ( editor.wp && editor.wp._createToolbar ) {

                editToolbar = editor.wp._createToolbar( [ 'demobutton0' ], true );

                editToolbar.on( 'hide', function() {
                    if ( ! editToolbar.scrolling ) {
                        editor.execCommand( 'tinymce_terms_cancel' );
                    }
                } );
            }
        } );

        editor.addCommand( 'TinyMCE_Terms', function() {
            if ( tinymce.Env.ie && tinymce.Env.ie < 10 ) {
                return;
            }

            linkNode = getSelectedLink();
            editToolbar.tempHide = false;

            if ( linkNode ) {
                editor.dom.setAttribs( linkNode, { 'data-tinymceterms-edit': true } );
            } else {
                removePlaceholders();
                editor.execCommand( 'mceInsertLink', false, { href: '_term_placeholder' } );

                linkNode = editor.$( 'a[href="_term_placeholder"]' )[0];
                editor.nodeChanged();
            }
        } );


        editor.addCommand( 'tinymce_terms_cancel', function() {
            if ( ! editToolbar.tempHide ) {
                removePlaceholders();
            }
        } );

        // WP default shortcuts
        // editor.addShortcut( 'access+a', '', 'TinyMCE_Terms' );
        // The "de-facto standard" shortcut, see #27305
        // editor.addShortcut( 'meta+k', '', 'TinyMCE_Terms' );

        editor.addButton( 'demobutton2', {
            icon:    'dashicon dashicons-tag',
            tooltip: 'Make Tag',
            cmd:     'TinyMCE_Terms'
        });

        // Remove any remaining placeholders on saving.
        editor.on( 'savecontent', function( event ) {
            event.content = removePlaceholderStrings( event.content, true );
        });

        // Prevent adding undo levels on inserting link placeholder.
        editor.on( 'BeforeAddUndo', function( event ) {
            if ( event.lastLevel && event.lastLevel.content && event.level.content &&
                event.lastLevel.content === removePlaceholderStrings( event.level.content ) ) {

                event.preventDefault();
            }
        });

        editor.addButton( 'demobutton0', {
            type: 'TinyMCETermsInput',
            onPostRender: function() {

                if ( $ && $.ui ) {

                    $('.add-tax').on( 'click', function( event ) {
                        event.preventDefault();

                        selection = editor.selection.getContent();
                        taxonomy  = $(this).text();

                        $.post( window.ajaxurl, {
                            action:        'mcedemo_add_tax',
                            post_id:       document.getElementById( 'post_ID' ).value,
                            selection:     selection,
                            taxonomy:      taxonomy,
                            mceDemo_nonce: mceDemo.nonce
                        }, function( data ) {
                            if ( data.success ) {
                                console.log( data );
                                term = data.data.term;

                                // @todo Core function for updating UI with added terms?
                                if ( 'category' == term.taxonomy ) {
                                    field = '<li id="category-' + term.term_id + '">' +
                                        '<label class="selectit">' +
                                        '<input value="' + term.term_id + '" type="checkbox" name="post_category[]" id="in-category-' + term.term_id + '" checked="checked"> ' + term.name +
                                        '</label></li>';
                                        $('#categorychecklist').prepend( field );
                                }
                                if ( 'post_tag' == term.taxonomy ) {
                                    $('#tax-input-post_tag').append(','+term.name );
                                }

                            } else {
                                // @todo Handle error
                            }
                        }, 'json' );

                    });

                }

            }
        } );

        editor.on( 'wptoolbar', function( event ) {
            var linkNode = editor.dom.getParent( event.element, 'a' ),
                $linkNode, href, edit;

            editToolbar.tempHide = false;

            if ( linkNode ) {
                $linkNode = editor.$( linkNode );
                href = $linkNode.attr( 'href' );
                edit = $linkNode.attr( 'data-tinymceterms-edit' );

                if ( href === '_term_placeholder' || edit ) {
                    event.element = linkNode;
                    event.toolbar = editToolbar;

                }
            } else if ( editToolbar.visible() ) {
                editor.execCommand( 'tinymce_terms_cancel' );
            }
        } );

        return {
            close: function() {
                editToolbar.tempHide = false;
                editor.execCommand( 'tinymce_terms_cancel' );
            }
        };

    } );

} )( window.tinymce );
