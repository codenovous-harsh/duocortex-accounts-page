import React from "react";

const CoinIcon = ({ size = 20, className = "" }) => {
  return (
    <img
      src="/rupee.png"
      alt="Rupee Coin"
      width={size}
      height={size}
      className={`inline-block ${className}`}
    />
  );
};

export default CoinIcon;
