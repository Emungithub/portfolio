import React from 'react';
import './Projects.css';

const projects = [
  {
    image: '/images/project1.jpg',
    title: 'Portfolio Website',
    url: 'https://eemun-portfolio.com',
    description: 'A personal portfolio website to showcase my work, skills, and contact information. Built with React, Next.js, and Three.js for interactive 3D elements.'
  },
  {
    image: '/images/project2.jpg',
    title: 'E-commerce Platform',
    url: 'https://eemun-shop.com',
    description: 'A full-featured e-commerce platform with product listings, shopping cart, and secure checkout. Developed using React, Node.js, and MongoDB.'
  },
  {
    image: '/images/project3.jpg',
    title: '3D Room Experience',
    url: 'https://eemun-3droom.com',
    description: 'An interactive 3D room built with Three.js, allowing users to explore and interact with objects in a virtual environment.'
  },
  // Add more projects as needed
];

const Projects: React.FC = () => (
  <section className="section section--projects">
    <h2>Projects</h2>
    <div className="projects-grid">
      {projects.map((project, idx) => (
        <a
          className="project-card"
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          key={idx}
        >
          <img src={project.image} alt={project.title} />
          <div className="project-info">
            <h3>{project.title}</h3>
            <p>{project.description}</p>
          </div>
        </a>
      ))}
    </div>
  </section>
);

export default Projects; 