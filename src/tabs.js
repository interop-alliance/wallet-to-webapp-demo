function main () {
  const initTabs = () => {
    if (typeof M !== 'undefined' && M.Tabs) {
      // Initialize Materialize tabs
      const tabs = document.querySelectorAll('.tabs');
      M.Tabs.init(tabs);

      // Get all tab content elements
      const tabContents = document.querySelectorAll('.tab-content');
      
      // Initially hide all tabs except the first one
      tabContents.forEach((content, index) => {
        if (index === 0) {
          content.style.display = 'block';
          content.classList.add('active');
        } else {
          content.style.display = 'none';
          content.classList.remove('active');
        }
      });

      // Add tab change event listener
      const tabLinks = document.querySelectorAll('.tabs .tab a');
      tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          const targetTab = this.getAttribute('href').substring(1); // Remove the # from href
          
          // Hide all tab contents
          tabContents.forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
          });
          
          // Show the selected tab content
          const selectedTab = document.getElementById(targetTab);
          if (selectedTab) {
            selectedTab.style.display = 'block';
            selectedTab.classList.add('active');
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
}

document.addEventListener('DOMContentLoaded', main);
