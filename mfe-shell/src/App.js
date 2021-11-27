import { ThemeProvider } from '@material-ui/core';
import { useRoutes } from 'react-router-dom';
import GlobalStyles from 'src/components/GlobalStyles';
import routes from 'src/routes';
import theme from 'src/theme';
import './App.css';



function App() {

  const routing = useRoutes(routes);

  return (
    <div className="App">

      <div>
        <ThemeProvider theme={theme}>
          <GlobalStyles />
          <div className="container">
            {routing}
          </div>

        </ThemeProvider>
      </div>
    </div>
  );
}

export default App;
