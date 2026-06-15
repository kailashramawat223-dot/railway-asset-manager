// Renders sidebar and sets active nav item based on current page
function renderSidebar(activePage) {
  const user = Auth.getUser() || {};
  const initial = (user.name || 'U')[0].toUpperCase();

  const navItems = [
    { id: 'dashboard',   icon: '◉',  label: 'Dashboard',    href: 'dashboard.html',   section: null },
    { id: 'assets',      icon: '🚂', label: 'Assets',        href: 'assets.html',      section: 'MANAGE' },
    { id: 'scan',        icon: '⬛', label: 'Scan QR Code',  href: 'scan.html',        section: null },
    { id: 'maintenance', icon: '🔧', label: 'Maintenance',   href: 'maintenance.html', section: null },
    { id: 'alerts',      icon: '🔔', label: 'Alerts',        href: 'alerts.html',      section: 'INSIGHTS' },
    { id: 'reports',     icon: '📊', label: 'Reports',       href: 'reports.html',     section: null },
    ...(user.role === 'admin' ? [{ id: 'users', icon: '👥', label: 'Users', href: 'users.html', section: 'ADMIN' }] : []),
    { id: 'profile',     icon: '👤', label: 'Profile',       href: 'profile.html',     section: 'ACCOUNT' },
  ];

  const html = `
    <div class="sidebar-logo">
      <div class="logo-mark">Rail<span>Track</span></div>
      <div class="logo-sub">Asset Manager</div>
    </div>
    <nav class="sidebar-nav">
      ${(() => {
        let html = '';
        let lastSection = 'NONE';
        navItems.forEach(item => {
          if (item.section && item.section !== lastSection) {
            html += `<div class="nav-section-label">${item.section}</div>`;
            lastSection = item.section;
          } else if (!item.section && lastSection === 'NONE' && html === '') {
            html += `<div class="nav-section-label">Navigation</div>`;
            lastSection = 'Navigation';
          }
          html += `
            <a href="${item.href}" class="nav-link ${activePage === item.id ? 'active' : ''}">
              <span class="nav-icon">${item.icon}</span>
              ${item.label}
            </a>`;
        });
        return html;
      })()}
    </nav>
    <div class="sidebar-footer">
      <div class="user-chip">
        <div class="user-avatar">${initial}</div>
        <div class="user-info">
          <div class="user-name">${user.name || 'User'}</div>
          <div class="user-role">${user.role || 'viewer'}</div>
        </div>
      </div>
      <button class="btn-logout" onclick="logout()">⬡ Sign Out</button>
    </div>
  `;

  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = html;
}

function logout() {
  Auth.clearSession();
  window.location.href = '../index.html';
}
