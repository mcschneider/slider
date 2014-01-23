/* =============================================================

	Tabby v4.0
	Simple, mobile-first toggle tabs by Chris Ferdinandi
	http://gomakethings.com

	Free to use under the MIT License.
	http://gomakethings.com/mit/

 * ============================================================= */

(function() {

	'use strict';

	// Feature Test
	if ( 'querySelector' in document && 'addEventListener' in window && Array.prototype.forEach ) {

		// Function to show a tab
		var showTab = function (toggle) {

			// Define the target tab
			var dataID = toggle.getAttribute('data-target');
			var dataTarget = document.querySelectorAll(dataID);

			// Get toggle siblings, toggle parent, and parent sibling elements
			var toggleParent = toggle.parentNode;
			var toggleSiblings = buoy.getSiblings(toggle);
			var toggleParentSiblings = buoy.getSiblings(toggleParent);

			// Add '.active' class to tab toggle and parent element
			buoy.addClass(toggle, 'active');
			buoy.addClass(toggleParent, 'active');

			// Remove '.active' class from all sibling elements
			[].forEach.call(toggleParentSiblings, function (sibling) {
				buoy.removeClass(sibling, 'active');
			});
			[].forEach.call(toggleSiblings, function (sibling) {
				buoy.removeClass(sibling, 'active');
			});

			// Add '.active' class to target tab
			[].forEach.call(dataTarget, function (target) {

				var targetSiblings = buoy.getSiblings(target);
				buoy.addClass(target, 'active');

				// Remove '.active' class from all other tabs
				[].forEach.call(targetSiblings, function (sibling) {
					buoy.removeClass(sibling, 'active');
				});

			});

		};

		// Define tab toggles
		var tabToggle = document.querySelectorAll('.tabs a, .tabs button');

		// For each tab toggle
		[].forEach.call(tabToggle, function (toggle) {

			// When tab toggle is clicked
			toggle.addEventListener('click', function(e) {

				// Prevent default link behavior
				e.preventDefault();

				// Activate the tab
				showTab(toggle);

			}, false);

		});

	}

})();