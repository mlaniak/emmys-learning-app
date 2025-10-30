import React, { useState, useEffect, useRef } from 'react';
import touchInteractionManager from '../utils/touchInteractionManager';
import TouchButton from './TouchButton';
import { getDeviceType, getTouchCapabilities } from '../utils/responsiveUtils';

/**
 * TouchContextMenu - Advanced context menu system for touch interfaces
 * 
 * Features:
 * - Long-press activation
 * - Touch-optimized menu items
 * - Nested submenus
 * - Icon and text support
 * - Customizable positioning
 * - Haptic feedback
 */
const TouchContextMenu = ({
  children,
  menuItems = [],
  trigger = 'longpress',
  position = 'auto',
  showIcons = true,
  hapticFeedback = true,
  className = '',
  onMenuOpen,
  onMenuClose,
  onItemSelect,
  ...props
}) => {
  const containerRef = useRef(null);
  const menuRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [deviceInfo, setDeviceInfo] = useState({
    type: 'desktop',
    touchCapabilities: {}
  });

  useEffect(() => {
    setDeviceInfo({
      type: getDeviceType(),
      touchCapabilities: getTouchCapabilities()
    });
  }, []);

  // Calculate optimal menu position
  const calculateMenuPosition = (x, y) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 200; // Estimated menu width
    const menuHeight = menuItems.length * 48; // Estimated menu height
    
    let finalX = x;
    let finalY = y;
    
    // Adjust horizontal position
    if (x + menuWidth > viewportWidth) {
      finalX = x - menuWidth;
    }
    
    // Adjust vertical position
    if (y + menuHeight > viewportHeight) {
      finalY = y - menuHeight;
    }
    
    // Ensure menu stays within viewport
    finalX = Math.max(10, Math.min(finalX, viewportWidth - menuWidth - 10));
    finalY = Math.max(10, Math.min(finalY, viewportHeight - menuHeight - 10));
    
    return { x: finalX, y: finalY };
  };

  // Open context menu
  const openMenu = (x, y) => {
    const pos = calculateMenuPosition(x, y);
    setMenuPosition(pos);
    setIsMenuOpen(true);
    
    if (hapticFeedback) {
      touchInteractionManager.triggerHaptic('contextMenu');
    }
    
    if (onMenuOpen) {
      onMenuOpen({ x, y, position: pos });
    }
  };

  // Close context menu
  const closeMenu = () => {
    setIsMenuOpen(false);
    setActiveSubmenu(null);
    
    if (onMenuClose) {
      onMenuClose();
    }
  };

  // Handle menu item selection
  const handleItemSelect = (item, event) => {
    if (item.disabled) return;
    
    if (hapticFeedback) {
      touchInteractionManager.triggerHaptic('selection');
    }
    
    if (item.submenu) {
      setActiveSubmenu(item.id);
    } else {
      if (item.action) {
        item.action(event);
      }
      
      if (onItemSelect) {
        onItemSelect(item, event);
      }
      
      closeMenu();
    }
  };

  // Set up touch interaction
  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    
    const touchHandlers = {
      onLongPress: (data) => {
        if (trigger === 'longpress') {
          openMenu(data.x, data.y);
        }
      },
      
      onTap: (data) => {
        if (trigger === 'tap') {
          openMenu(data.x, data.y);
        }
      },
      
      onDoubleTap: (data) => {
        if (trigger === 'doubletap') {
          openMenu(data.x, data.y);
        }
      }
    };

    const cleanup = touchInteractionManager.addTouchSupport(element, touchHandlers);
    
    return cleanup;
  }, [trigger]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    const handleTouchOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleTouchOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [isMenuOpen]);

  // Render menu item
  const renderMenuItem = (item, index) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isActive = activeSubmenu === item.id;
    
    return (
      <div key={item.id || index} className="relative">
        <TouchButton
          onClick={(e) => handleItemSelect(item, e)}
          disabled={item.disabled}
          variant="ghost"
          size="medium"
          className={`w-full justify-start text-left px-4 py-3 hover:bg-gray-100 ${
            item.disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${isActive ? 'bg-blue-50' : ''}`}
          hapticType="tap"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              {showIcons && item.icon && (
                <span className="mr-3 text-lg">{item.icon}</span>
              )}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            
            {hasSubmenu && (
              <span className="text-gray-400">▶</span>
            )}
            
            {item.shortcut && (
              <span className="text-xs text-gray-400 ml-2">{item.shortcut}</span>
            )}
          </div>
        </TouchButton>
        
        {/* Submenu */}
        {hasSubmenu && isActive && (
          <div className="absolute left-full top-0 ml-1 bg-white rounded-lg shadow-lg border min-w-48 z-50">
            {item.submenu.map((subItem, subIndex) => renderMenuItem(subItem, subIndex))}
          </div>
        )}
        
        {/* Separator */}
        {item.separator && (
          <div className="border-t border-gray-200 my-1" />
        )}
      </div>
    );
  };

  const isMobile = deviceInfo.type === 'mobile' || deviceInfo.type === 'ios' || deviceInfo.type === 'android';

  return (
    <>
      {/* Trigger element */}
      <div
        ref={containerRef}
        className={`touch-context-menu-trigger ${className}`}
        style={{
          touchAction: 'manipulation',
          userSelect: 'none'
        }}
        {...props}
      >
        {children}
      </div>

      {/* Context menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={closeMenu}
            onTouchStart={closeMenu}
          />
          
          {/* Menu */}
          <div
            ref={menuRef}
            className="fixed bg-white rounded-lg shadow-xl border z-50 min-w-48 max-w-64 overflow-hidden"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
              animation: 'touchMenuFadeIn 0.2s ease-out'
            }}
          >
            {/* Menu header */}
            {menuItems.some(item => item.header) && (
              <div className="px-4 py-2 bg-gray-50 border-b">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {menuItems.find(item => item.header)?.header}
                </span>
              </div>
            )}
            
            {/* Menu items */}
            <div className="py-1">
              {menuItems.filter(item => !item.header).map((item, index) => renderMenuItem(item, index))}
            </div>
            
            {/* Mobile-specific close button */}
            {isMobile && (
              <div className="border-t bg-gray-50 p-2">
                <TouchButton
                  onClick={closeMenu}
                  variant="secondary"
                  size="small"
                  className="w-full"
                >
                  Close
                </TouchButton>
              </div>
            )}
          </div>
        </>
      )}

      {/* CSS animations */}
      <style jsx>{`
        @keyframes touchMenuFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
};

/**
 * TouchContextMenuProvider - Context provider for global menu management
 */
export const TouchContextMenuProvider = ({ children }) => {
  const [globalMenus, setGlobalMenus] = useState([]);

  const showGlobalMenu = (x, y, menuItems, options = {}) => {
    const menuId = `global-menu-${Date.now()}`;
    const newMenu = {
      id: menuId,
      x,
      y,
      menuItems,
      options
    };
    
    setGlobalMenus(prev => [...prev, newMenu]);
    
    return () => {
      setGlobalMenus(prev => prev.filter(menu => menu.id !== menuId));
    };
  };

  const hideAllMenus = () => {
    setGlobalMenus([]);
  };

  return (
    <div className="touch-context-menu-provider">
      {children}
      
      {/* Global menus */}
      {globalMenus.map(menu => (
        <TouchContextMenu
          key={menu.id}
          menuItems={menu.menuItems}
          position={{ x: menu.x, y: menu.y }}
          onMenuClose={() => {
            setGlobalMenus(prev => prev.filter(m => m.id !== menu.id));
          }}
          {...menu.options}
        />
      ))}
    </div>
  );
};

/**
 * useTouchContextMenu - Hook for programmatic menu control
 */
export const useTouchContextMenu = () => {
  const showMenu = (element, menuItems, options = {}) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    return touchInteractionManager.createContextMenu(element, menuItems, {
      ...options,
      hapticType: 'contextMenu'
    })(x, y);
  };

  const hideAllMenus = () => {
    touchInteractionManager.hideAllContextMenus();
  };

  return {
    showMenu,
    hideAllMenus
  };
};

/**
 * TouchQuickActions - Quick action buttons that appear on long press
 */
export const TouchQuickActions = ({
  children,
  actions = [],
  layout = 'radial',
  className = '',
  ...props
}) => {
  const [showActions, setShowActions] = useState(false);
  const [actionPosition, setActionPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleLongPress = (data) => {
    setActionPosition({ x: data.x, y: data.y });
    setShowActions(true);
    touchInteractionManager.triggerHaptic('contextMenu');
  };

  const handleActionSelect = (action) => {
    setShowActions(false);
    touchInteractionManager.triggerHaptic('selection');
    if (action.action) {
      action.action();
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const cleanup = touchInteractionManager.addTouchSupport(containerRef.current, {
      onLongPress: handleLongPress
    });

    return cleanup;
  }, []);

  const getActionPosition = (index, total) => {
    if (layout === 'radial') {
      const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
      const radius = 60;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    } else {
      // Linear layout
      return {
        x: (index - (total - 1) / 2) * 60,
        y: 0
      };
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`touch-quick-actions-trigger ${className}`}
        {...props}
      >
        {children}
      </div>

      {showActions && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowActions(false)}
            onTouchStart={() => setShowActions(false)}
          />
          
          <div
            className="fixed z-50"
            style={{
              left: `${actionPosition.x}px`,
              top: `${actionPosition.y}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            {actions.map((action, index) => {
              const pos = getActionPosition(index, actions.length);
              return (
                <TouchButton
                  key={action.id || index}
                  onClick={() => handleActionSelect(action)}
                  variant="primary"
                  size="medium"
                  className="absolute w-12 h-12 rounded-full shadow-lg"
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    transform: 'translate(-50%, -50%)',
                    animation: `quickActionAppear 0.3s ease-out ${index * 0.05}s both`
                  }}
                  aria-label={action.label}
                >
                  <span className="text-lg">{action.icon}</span>
                </TouchButton>
              );
            })}
          </div>

          <style jsx>{`
            @keyframes quickActionAppear {
              from {
                opacity: 0;
                transform: translate(-50%, -50%) scale(0);
              }
              to {
                opacity: 1;
                transform: translate(-50%, -50%) scale(1);
              }
            }
          `}</style>
        </>
      )}
    </>
  );
};

export default TouchContextMenu;