// tabs.js - Handles tab switching with the new tab loader system

document.addEventListener('DOMContentLoaded', function() {
  // Wait for MaterializeCSS to be available
  const initTabs = () => {
    if (typeof M !== 'undefined' && M.Tabs) {
      // Initialize Materialize tabs
      const tabs = document.querySelectorAll('.tabs');
      M.Tabs.init(tabs);

      // Add tab change event listener
      const tabLinks = document.querySelectorAll('.tabs .tab a');
      tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          const targetTab = this.getAttribute('href').substring(1); // Remove the # from href
          
          // Load the tab content if not already loaded
          if (window.tabLoader) {
            window.tabLoader.loadTab(targetTab);
          }
        });
      });

      console.log('Tabs initialized successfully');
    } else {
      // Retry after a short delay
      setTimeout(initTabs, 100);
    }
  };

  // Start initialization
  initTabs();
});
