<?php
/**
 ** Plugin Name: TinyMCE Terms
 **/

/**
 * TinyMCE_Terms_Demo
 *
 */
class TinyMCE_Terms_Demo {

	/**
	 * TinyMCE plugin name
	 */
	var $plugin_name = 'TinyMCE_Terms';

	/**
	 * Internal version (cache buster)
	 */
	var $internal_version = 702;

	/**
	 * Get hooked in
	 *
	 * @return void
	 */
	function __construct()  {

		add_action('admin_enqueue_scripts',   array( $this, 'admin_enqueue_scripts') );
		add_action('wp_ajax_mcedemo_add_tax', array( $this, 'mcedemo_add_tax') );

		// init process for button control
		add_action('admin_init',              array( $this, 'add_buttons') );
		// Modify the version when tinyMCE plugins are changed.
		add_filter('tiny_mce_version',        array( $this, 'tiny_mce_version') );
	}

	/**
	 * Load data via wp_localize_script
	 *
	 * @return void
	 */
	function admin_enqueue_scripts() {

		global $post;

		if ( is_null( $post ) ) {
			return;
		}

		$taxonomies = array();
		foreach ( get_object_taxonomies( $post->post_type ) as $tax ) {
			$taxonomies[] = "<button class='add-tax button'>$tax</button>";
		}

		wp_localize_script( 'editor', 'mceDemo', array(
			'taxonomies'  => implode( ' ', $taxonomies ),
			'nonce'       => wp_create_nonce( 'mceDemo' ),
		) );
	}

	/**
	 * Ajax callback.
	 * Insert selection as taxonomy term
	 *
	 * @return void
	 */
	function mcedemo_add_tax() {

		if ( ! check_ajax_referer( 'mceDemo', 'mceDemo_nonce' ) ) {
			wp_send_json_error( $_POST );
		}

		// @todo Sanitize selection, verify taxonomy
		// @todo Check if term already exists for post

		$ids = wp_set_object_terms( $_POST['post_id'], $_POST['selection'], $_POST['taxonomy'], true );

		wp_send_json_success( array( 'term' => get_term_by( 'id', $ids[0], $_POST['taxonomy'] ) ) );

	}

	/**
	 * register buttons and tinymce plugin
	 *
	 * @return void
	 */
	function add_buttons() {
		// Don't bother doing this stuff if the current user lacks permissions
		if ( ! current_user_can('edit_posts') && ! current_user_can('edit_pages') ) {
			return;
		}
		// Add only in Rich Editor mode
		if ( 'true' == get_user_option('rich_editing') ) {
			add_filter('mce_buttons',          array( $this, 'register_button' ), 0 );
			add_filter('mce_external_plugins', array( $this, 'add_tinymce_plugin' ) );
		}
	}

	/**
	 * add button to editor
	 *
	 * @param array $buttons
	 * @return array
	 */
	function register_button( $buttons ) {

		array_push( $buttons, 'demobutton2' );

		return $buttons;
	}

	/**
	 * Load the TinyMCE plugin : mcedemo_plugin.js
	 *
	 * @param array $plugin_array
	 * @return array
	 */
	function add_tinymce_plugin( $plugin_array ) {

		$plugin_array[ $this->plugin_name ] =  plugins_url( 'plugin.js', __FILE__ );

		return $plugin_array;
	}

	/**
	 * A different version will rebuild the cache
	 *
	 * @param int $version
	 * @return int
	 */
	function tiny_mce_version( $version ) {
		$version = $version + $this->internal_version;
		return $version;
	}

}

$tinymce_terms_demo = new TinyMCE_Terms_Demo();
