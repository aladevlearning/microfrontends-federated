import { Suspense } from 'react';
import { dynamicImport } from '../../mfe-utils/importUtils.js';

const AccountsApp = React.lazy(
  () => dynamicImport('mfeAccounts/App')
);

const PaymentsApp = React.lazy(
  () => {
    return dynamicImport('mfePayments/App');
  }
);


function App() {

  return (
    <div className="App">

      <hr />
      <Suspense fallback='Loading Button'>
        <AccountsApp />
      </Suspense>
      <Suspense fallback='Loading Button'>
        <PaymentsApp />
      </Suspense>
    </div>
  );
}

export default App;
