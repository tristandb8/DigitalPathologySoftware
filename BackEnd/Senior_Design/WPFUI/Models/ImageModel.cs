using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;
using WPFUI.ViewModels;

namespace WPFUI.Models
{
    public class ImageModel
    {
        // InitializeComponent();
        public byte[] LoadedImage { get; set; }
        public BitmapImage Source { get; internal set; }
        //BitmapImage image = new BitmapImage(new Uri(@"pack://application:,,/cells.png");
    }
}
