<script>
const toggleActive = ()=>{
  let activeElements = document.getElementsByClassName('active');
  activeElements[0].classList.remove('active');
  let element = event.path[1]
  element.classList.add('active');
}
</script>
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
    min-height: 450px;
  }
  .navbar {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    font-family: sans-serif;
    list-style: none;
  }
  .navbar > li {
    font-size: 20px;
    margin-left: 20px;
    cursor: pointer;
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
    align-self: flex-start;
    max-width:300px;
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
	  position: relative;
	  left:0;
	  min-height:500px;
	  z-index:-1;
  }
  .name > hr{
	  width:20%;
	  background: purple;
	  min-height:10px;
    margin-left:0px;
    border:none;
  }
  ul.navbar > li.active {
    border-bottom: 3px solid purple;
  }
  a{
		color:purple;
		font-size:20px;
		font-weight: bold;
  }
  h5{
    font-size: 15px;
  }
  h3{
    font-size:25px;
    line-height:35px;
  }
  p{
    font-size:20px;
    line-height:30px;
  }
  a,h1,h5,h3,p{
    font-family: sans-serif;
  }
  @media only screen and (max-width: 767px) {
	img{
		display: none;
  }
  .info{
    max-width: 100%;
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
    <li class="active" on:click={toggleActive}>
      <b>Services</b>
    </li>
    <li on:click={toggleActive} >
      <b>About</b>
    </li>
    <li on:click={toggleActive}>
      <b>Work</b>
    </li>
  </ul>
</div>
<section id="name">
  <div class="container">
    <div class="banner">
      <div class="name">
        <h1>Dharmil</h1>
        <h1>Parekh</h1>
		<hr>
      </div>
      <img src="./profpic.jpg" width="350px">
      <div class="info">
        <h5>-Introduction</h5>
        <h3>Full Stack Developer based in India</h3>
        <p>
          Innovative optimized solution seeker. Excited to be at the development phase of my new career as a web developer. I am ambitious, adventurous and assiduos.
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
