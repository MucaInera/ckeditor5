/**
 * @license Copyright (c) 2003-2021, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module html-support/htmlcomment
 */

import { Plugin } from 'ckeditor5/src/core';
import { uid } from 'ckeditor5/src/utils';

/**
 * The HTML comment feature.
 *
 * For a detailed overview, check the {@glink features/html-comment HTML comment feature documentation}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class HtmlComment extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'HtmlComment';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		editor.data.registerRawContentMatcher( {
			name: '$comment'
		} );

		// Convert the `$comment` view element to `$comment:<unique id>` marker and store its content (the comment itself) as a $root
		// attribute. The comment content is needed in the `dataDowncast` pipeline to re-create the comment node.
		editor.conversion.for( 'upcast' ).elementToMarker( {
			view: '$comment',
			model: ( viewElement, { writer } ) => {
				const commentContent = viewElement.getCustomProperty( '$rawContent' );
				const root = editor.model.document.getRoot();
				const markerName = `$comment:${ uid() }`;

				writer.setAttribute( markerName, commentContent, root );

				return markerName;
			}
		} );

		// Convert the `$comment` marker to `$comment` UI element with `$rawContent` custom property containing the comment content.
		editor.conversion.for( 'dataDowncast' ).markerToElement( {
			model: '$comment',
			view: ( modelElement, { writer } ) => {
				const root = editor.model.document.getRoot();
				const markerName = modelElement.markerName;
				const commentContent = root.getAttribute( markerName );

				const comment = writer.createUIElement( '$comment' );

				writer.setCustomProperty( '$rawContent', commentContent, comment );

				return comment;
			}
		} );
	}

	/**
	 * Creates an HTML comment on the specified position and returns its marker.
	 */
	createHtmlComment( position, content ) {
		const editor = this.editor;
		const model = editor.model;
		const root = model.document.getRoot();
		const markerName = `$comment:${ uid() }`;

		return model.change( writer => {
			const range = writer.createRange( position );

			const marker = writer.addMarker( markerName, {
				usingOperation: true,
				affectsData: true,
				range
			} );

			writer.setAttribute( markerName, content, root );

			return marker;
		} );
	}

	/**
	 * Removes an HTML Comment by its marker.
	 *
	 * @param {String} marker marker to remove.
	 */
	removeHtmlComment( marker ) {
		const editor = this.editor;
		const root = editor.model.document.getRoot();

		editor.model.change( writer => {
			writer.removeMarker( marker );
			writer.removeAttribute( marker.name, root );
		} );
	}
}
