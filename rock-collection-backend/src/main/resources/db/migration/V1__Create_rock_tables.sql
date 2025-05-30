CREATE TABLE rock_group_properties (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    family VARCHAR(255),
    type VARCHAR(255),
    mohs_hardness VARCHAR(50),
    color VARCHAR(255),
    streak VARCHAR(255),
    luster VARCHAR(255),
    cleavage_fracture VARCHAR(255),
    crystal_form VARCHAR(255),
    density VARCHAR(50),
    transparency VARCHAR(255),
    magnetism BOOLEAN,
    notable_characteristics TEXT
);

CREATE TABLE collected_rocks (
    id SERIAL PRIMARY KEY,
    rock_name VARCHAR(255) NOT NULL,
    market_name VARCHAR(255),
    group_id INT REFERENCES rock_group_properties(id),
    origin VARCHAR(255),
    notes TEXT
);
