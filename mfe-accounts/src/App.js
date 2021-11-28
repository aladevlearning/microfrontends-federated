import accountsImage from './images/accounts.jpg';
import Header from '@aladevlearning/core/src/components/Header.js'
import Footer from '@aladevlearning/core/src/components/Footer.js'

function App() {

  return (
    <div className="App">
      <Header />
      <img src={accountsImage} height="540px" />
      <Footer />
    </div >
  );
}

export default App;
