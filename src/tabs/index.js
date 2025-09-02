function main() {
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
        link.addEventListener('click', function (e) {
          e.preventDefault();
          const targetId = this.getAttribute('href').substring(1);

          // Let Materialize update the indicator and active classes
          const tabsEl = this.closest('.tabs');
          const instance = tabsEl && M.Tabs.getInstance(tabsEl);
          if (instance && targetId) instance.select(targetId);

          // Manually toggle corresponding content visibility
          tabContents.forEach(content => {
            content.style.display = 'none';
            content.classList.remove('active');
          });
          const selected = document.getElementById(targetId);
          if (selected) {
            selected.style.display = 'block';
            selected.classList.add('active');
          }

          // Update URL hash without scrolling
          if (targetId && history.replaceState) {
            history.replaceState(null, '', `#${targetId}`);
          }
        });
      });

      // If URL has a hash, activate that tab on load
      const initialHash = (location.hash || '').replace('#', '');
      if (initialHash) {
        const initialLink = document.querySelector(
          `.tabs .tab a[href="#${initialHash}"]`
        );
        if (initialLink) initialLink.click();
      }

      console.log('Tabs initialized successfully');
    } else {
      setTimeout(initTabs, 100);
    }
  };

  initTabs();
}

document.addEventListener('DOMContentLoaded', main);
