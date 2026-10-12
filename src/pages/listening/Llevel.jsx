import React, { useState } from "react";
import { Link } from "react-router-dom";
import listeningData from "./finaljson.json";
import Nav from "../../components/Nav";


function Llevel({ Toggle }) {
  const [selectedLevel, setSelectedLevel] = useState("a1");

  const handleLevelClick = (level) => {
    setSelectedLevel(level);
  };

  const listenings = listeningData[selectedLevel];

  return (
    <>
    <Nav Toggle={Toggle} />
    <div className="container mt-4" style={{ background: "rgba(242,247,250,255)" }}>
      <div className="row mb-3">
        {["a1", "a2", "b1", "b2", "c1"].map((lvl) => (
          <div className="col" key={lvl}>
            <button
              onClick={() => handleLevelClick(lvl)}
              className={`btn w-100 ${
                lvl === selectedLevel ? "btn-success" : "btn-outline-primary"
              }`}
            >
              {lvl.toUpperCase()}
            </button>
          </div>
        ))}
      </div>
        {/*
      <h4>{selectedLevel.toUpperCase()} Listening Exercises</h4>
      <ul className="list-group">
        {listenings.map((item, index) => (
          <Link
            key={index}
            to={`/listening/${selectedLevel}/${index}`}
            className="list-group-item list-group-item-action"
          >
            {item.title}
            {item.image && (
              <img src={item.image} alt={item.title} className="img-fluid" />
            )}
          </Link>
        ))}
      </ul>*/ }
      <br />
      <h4>{selectedLevel.toUpperCase()} Listening Exercises</h4>
      {listenings.map((item, index) => (
         <Link key={index} to={`/listening/${selectedLevel}/${index}`} className="text-decoration-none text-dark">
            <div className="row" style={{maxHeight:"300px"}}>
                <div className="col" style={{textAlign:"center"}}> {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="img-fluid rounded-start"
                  style={{ height: "60%", objectFit: "cover" }}
                />
              )}</div>
              <div className="col">
              <h5 >{item.title}</h5>
              <p >{item.descriptiom}</p>
              </div>
            </div>
         </Link>
      ))}
      <br />
      {/**
      <h4>{selectedLevel.toUpperCase()} Listening Exercises</h4>
      {listenings.map((item, index) => (
        <Link key={index} to={`/listening/${selectedLevel}/${index}`} className="text-decoration-none text-dark">
        <div className="card mb-3" style={{ maxWidth: "600px" }}>
          <div className="row g-0">
            <div className="col-md-4">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="img-fluid rounded-start"
                  style={{ height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            <div className="col-md-8">
              <div className="card-body">
                <h5 className="card-title">{item.title}</h5>
                <p className="card-text">{item.description}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      ))} */}
    </div>
    </>
  );
}

export default Llevel;
