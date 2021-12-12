import React, { useState } from 'react';
import { IntlProvider } from 'react-intl';
import Layout from './components/Layout';
import messages from './messages';
import './styles/App.scss';

function App() {
  const [locale, setLocale] = useState('en');
  return (
    <>
      <IntlProvider locale={locale} messages={messages[locale]}>
        <Layout />
      </IntlProvider>
    </>
  );
}
export default App;
