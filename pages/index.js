import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.overlay}>
          <h1 className={styles.title}>Your Name</h1>
          <p className={styles.subtitle}>Frontend Developer | UI/UX Enthusiast | React Specialist</p>
        </div>
      </section>

      <section className={styles.skills}>
        <h2 className={styles.sectionTitle}>My Skills</h2>
        <div className={styles.skillsGrid}>
          {/* Trainee can add more skills */}
          <div className={styles.skillCard}>
            <h3>Frontend</h3>
            <p>HTML, CSS, JavaScript</p>
          </div>
          <div className={styles.skillCard}>
            <h3>Frameworks</h3>
            <p>React, Next.js</p>
          </div>
          <div className={styles.skillCard}>
            <h3>Tools</h3>
            <p>Git, VS Code, Figma</p>
          </div>
        </div>
      </section>

      <section className={styles.projects}>
        <h2 className={styles.sectionTitle}>Featured Projects</h2>
        <div className={styles.projectsGrid}>
          {/* Trainee can add their projects */}
          <div className={styles.projectCard}>
            <h3>Project Name</h3>
            <p>Brief description of your project goes here. What technologies did you use?</p>
            <div className={styles.projectLinks}>
              <a href="#" className={styles.link}>Live Demo</a>
              <a href="#" className={styles.link}>GitHub</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}