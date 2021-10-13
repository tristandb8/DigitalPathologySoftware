using Caliburn.Micro;
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
using WPFUI.Models;
using WPFUI.Views;



namespace WPFUI.ViewModels
{
    public partial class SecondChildViewModel : Screen
    {
        private ImageModel _selectedImage;
        public SecondChildViewModel()
        {
            // ImageModel.Add()
        }

        public ImageModel LoadedImage
        {
            get { return _selectedImage; }
            set
            {
                _selectedImage = value;
            }
        }

        public void RotateLeftClick(object sender, RoutedEventArgs e)
        {


            if (LoadedImage == null)
                return;

            //Create source
            BitmapImage bi = new BitmapImage();
            //BitmapImage properties must be in a BeginInit/EndInit block

            bi.BeginInit();
            bi.UriSource = new Uri(@"pack://application:,,/cells.png");
            //Set image rotation

            if (((BitmapImage)LoadedImage.Source).Rotation == Rotation.Rotate0)
            {
                bi.Rotation = Rotation.Rotate270;
            }
            else if (((BitmapImage)LoadedImage.Source).Rotation == Rotation.Rotate90)
            {
                bi.Rotation = Rotation.Rotate0;
            }
            else if (((BitmapImage)LoadedImage.Source).Rotation == Rotation.Rotate180)
            {
                bi.Rotation = Rotation.Rotate90;
            }
            else if (((BitmapImage)LoadedImage.Source).Rotation == Rotation.Rotate270)
            {
                bi.Rotation = Rotation.Rotate180;
            }
            else
            {
                MessageBox.Show("ERROR");
            }
            bi.EndInit();
            //set image source
            LoadedImage.Source = bi;

        }

        public void RotateRightClick(object sender, RoutedEventArgs e)
        {

            if (LoadedImage == null)
                return;

            //Create source
            BitmapImage bi = new BitmapImage();
            //BitmapImage properties must be in a BeginInit/EndInit block
            bi.BeginInit();
            bi.UriSource = new Uri(@"pack://application:,,/cells.png");
            //Set image rotation

            if (((BitmapImage)LoadedImage.Source).Rotation == Rotation.Rotate0)
            {
                bi.Rotation = Rotation.Rotate90;
            }
            else if (((BitmapImage)LoadedImage.Source).Rotation == Rotation.Rotate90)
            {
                bi.Rotation = Rotation.Rotate180;
            }
            else if (((BitmapImage)LoadedImage.Source).Rotation == Rotation.Rotate180)
            {
                bi.Rotation = Rotation.Rotate270;
            }
            else if (((BitmapImage)LoadedImage.Source).Rotation == Rotation.Rotate270)
            {
                bi.Rotation = Rotation.Rotate0;
            }
            else
            {
                MessageBox.Show("ERROR");
            }
            bi.EndInit();
            //set image source
            LoadedImage.Source = bi;
        }
    }
}
