export default function About() {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-20">
        {/* Profile Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
            <div className="w-64 h-64 relative group">
              <img
                src="/profile.jpg"
                alt="Profile"
                className="w-full h-full rounded-full object-cover shadow-lg 
                         transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="text-center lg:text-left max-w-2xl">
              <h1 className="text-4xl font-bold text-gray-800 mb-8">About Me</h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                I'm a passionate web developer with a knack for building engaging,
                user-friendly web applications. My work combines technical expertise
                and creative problem-solving to craft beautiful and functional websites.
              </p>
            </div>
          </div>
        </section>
  
        {/* Experience Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Experience</h2>
            <div className="max-w-3xl mx-auto space-y-8">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Company Name</h3>
                <p className="text-gray-600 mb-2">Position • 2023 - Present</p>
                <p className="text-gray-600">
                  [Describe your role and key achievements]
                </p>
              </div>
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-xl font-semibold text-gray-800">Previous Company</h3>
                <p className="text-gray-600 mb-2">Position • 2021 - 2023</p>
                <p className="text-gray-600">
                  [Describe your role and key achievements]
                </p>
              </div>
            </div>
          </div>
        </section>
  
        {/* Education Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Education</h2>
            <div className="max-w-3xl mx-auto">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800">University Name</h3>
                <p className="text-gray-600 mb-2">Degree • Graduation Year</p>
                <p className="text-gray-600">
                  [Add relevant coursework or achievements]
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }
    