<style>
  .container {
    margin: 0 auto;
    position: relative;
    display: block;
    padding-left: 15px;
    padding-right: 15px;
    padding-top: 20px;
    max-width: 1100px;
  }
  .bg-gray {
    background-color: #d3d3d3;
    color: #2f4f4f;
  }
  section {
    min-height: 500px;
  }
  .navbar {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    list-style: none;
  }
  .navbar > li {
    font-size: 20px;
    margin-left: 20px;
  }
  h1 {
    font-size: 70px;
    margin: 0px;
  }
  .banner {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    flex-wrap: wrap;
  }
  .info {
    align-self: center;
    width: 250px;
  }
  .row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }
  .column {
    display: flex;
    flex-direction: column;
  }
  img{
	  position: absolute;
	  left:0;
	  transform:translateX(25vw);
	  min-height:500px;
	  z-index:-1;
  }
  .name > hr{
	  width:20%;
	  background: purple;
	  min-height:10px;
	  margin-left:0px;
  }
  ul.navbar > li.active {
	  border-bottom: 3px solid purple;
  }
  a{
		color:purple;
		font-size:20px;
		font-weight: bold;
  }
  @media only screen and (max-width: 767px) {
	img{
		display: none;
	}
    .navbar {
      padding: 0px;
      justify-content: start;
    }
    ul.navbar > li {
      margin: 10px;
    }
  }
</style>

<div class="container">
  <ul class="navbar">
    <li class="active">
      <b>Services</b>
    </li>
    <li>
      <b>About</b>
    </li>
    <li>
      <b>Work</b>
    </li>
  </ul>
</div>
<img src="./profpic.jpg" width="400px">
<section id="name">
  <div class="container">
    <div class="banner">
      <div class="name">
        <h1>Dharmil</h1>
        <h1>Parekh</h1>
		<hr>
      </div>
      <div class="info">
        <h5>-Introduction</h5>
        <h3>Full Stack Developer based in India</h3>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et
        </p>
		<a href="#">For More Info</a>
      </div>
	  
    </div>
  </div>
</section>
<section id="contactus" class="bg-gray">
  <div class="container">
    <div class="row">
      <div class="column">
        
          <h5>-Contact</h5>
          <h3>Full Stack Developer based in India</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et
          </p>
        </div>
      
      <div class="column">
        
          <h5>-Contact</h5>
          <h3>Full Stack Developer based in India</h3>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et
          </p>
        </div>
    </div>
  </div>
</section>
