import './App.css';
import paymentsImage from './images/payments.jpg';
import Header from 'mfe-core/src/components/Header.js'
import Footer from 'mfe-core/src/components/Footer.js'

function App() {

  return (
    <div className="App">
      <Header />
      <img src={paymentsImage} />
      <Footer />
    </div>
  );
}

export default App;
