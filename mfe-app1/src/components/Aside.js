import React from 'react';
import { useIntl } from 'react-intl';
import {
    Menu,
    MenuItem, ProSidebar, SidebarContent, SidebarHeader
} from 'react-pro-sidebar';

const Aside = ({ collapsed, rtl, toggled, handleToggleSidebar, handleApp2, handleApp3 }) => {
    const intl = useIntl();


    return (
        <ProSidebar
            rtl={rtl}
            collapsed={collapsed}
            toggled={toggled}
            breakPoint="md"
            onToggle={handleToggleSidebar}
        >
            <SidebarHeader>
                <div
                    style={{
                        padding: '24px',
                        fontWeight: 'bold',
                        fontSize: 14,
                        letterSpacing: '1px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {intl.formatMessage({ id: 'sidebarTitle' })}
                </div>
            </SidebarHeader>

            <SidebarContent>
                <Menu iconShape="circle">
                    <MenuItem
                        onClick={handleApp2}
                    >
                        {intl.formatMessage({ id: 'mfeApp2' })}
                    </MenuItem>
                    <MenuItem
                        onClick={handleApp3}
                    > {intl.formatMessage({ id: 'mfeApp3' })}</MenuItem>
                </Menu>
            </SidebarContent>
        </ProSidebar>
    );
};

export default Aside;