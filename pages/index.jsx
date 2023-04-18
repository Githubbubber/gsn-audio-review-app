import analyticsService from '../lib/analytics';

const Home = () => {
  {/* Default Head with default <title> to be loaded in NavBar */}
  analyticsService('Page Viewed');

  const handleLogin = () => {
    window.location.href = '/login';
  };

  return <main className="flex min-h-screen flex-col items-center justify-between p-24">
    <h1 style="text-align: center;">Entertaining Others the Way YOU Want</h1>

    <p style="text-align: center;">
      The Gifted Sounds Network's Audio Review App is a straightforward audio player and <br />notes taker that lets you give real-time feedback on your recordings. <br /><br />Since you're the primary visionary, we do as you say.
    </p>

    <button className="ml-[41%]" onclick={handleLogin}>
      Enter Your Given Password to Continue
    </button>
    
    <div id="portal"></div>
  </main>;
}

export default Home;
