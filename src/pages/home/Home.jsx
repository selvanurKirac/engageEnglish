import React from "react";
import "../../assets/css/style.css";
import CarouselPage from "../../components/CarouselPage";
import Nav from "../../components/Nav";

function Home({ Toggle }) {
  return (
    <div className="px-3">
      <Nav Toggle={Toggle} />
      <CarouselPage />
    </div>
  );
}
export default Home;
