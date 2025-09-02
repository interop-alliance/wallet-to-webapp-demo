function main () {
  const initTabs = () => {
    if (typeof M !== 'undefined' && M.Tabs) {
      const tabs = document.querySelectorAll('.tabs');
      M.Tabs.init(tabs);

      const tabContents = document.querySelectorAll('.tab-content');

      tabContents.forEach((content, index) => {
        if (index === 0) {
          content.style.display = 'block';
          content.classList.add('active');
        } else {
          content.style.display = 'none';
          content.classList.remove('active');
        }
      });

      const tabLinks = document.querySelectorAll('.tabs .tab a');
      tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          const targetTab = this.getAttribute('href').substring(1); // Remove the # from href

          tabContents.forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
          });

          const selectedTab = document.getElementById(targetTab);
          if (selectedTab) {
            selectedTab.style.display = 'block';
            selectedTab.classList.add('active');
          }
        });
      });

      console.log('Tabs initialized successfully');
    } else {
      setTimeout(initTabs, 100);
    }
  };

  initTabs();
}

document.addEventListener('DOMContentLoaded', main);
