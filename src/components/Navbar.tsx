import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="flex justify-center items-center relative transition-all duration-300 transform group-hover:scale-110 group-hover:brightness-110">
              <img src="/icon.png" alt="" className='w-14' />
              <span className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300">
                CF FaceOFF
              </span>
            </div>
          </Link>
          <div className="flex space-x-6">
            <Link to="/compare" className="flex items-center space-x-1 text-gray-600 hover:text-indigo-600 transition-colors duration-300">
              <Users className="h-5 w-fit" />
              <span>Compare </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;