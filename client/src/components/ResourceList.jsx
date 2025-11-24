import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, Info, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import api from '../services/api';

const ResourceList = ({ user }) => {
  const [resources, setResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [currentResource, setCurrentResource] = useState(null);
  const [formData, setFormData] = useState({
    name: '', project: '', joiningDate: '', birthday: '', diet: 'Veg', skills: '', gender: 'Male', mobile: ''
  });
  const fileInputRef = useRef(null);

  const isManager = user.role === 'manager';

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const data = await api.get('/api/resources');
      setResources(data);
    } catch (err) {
      console.error('Failed to fetch resources');
    }
  };

  const handleOpenDialog = (resource = null) => {
    if (resource) {
      setCurrentResource(resource);
      setFormData(resource);
    } else {
      setCurrentResource(null);
      setFormData({ name: '', project: '', joiningDate: '', birthday: '', diet: 'Veg', skills: '', gender: 'Male', mobile: '' });
    }
    setIsDialogOpen(true);
  };

  const handleOpenInfoDialog = (resource) => {
    setCurrentResource(resource);
    setIsInfoDialogOpen(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a name');
      return false;
    }
    if (!formData.project.trim()) {
      toast.error('Please enter a project');
      return false;
    }
    if (!formData.joiningDate) {
      toast.error('Please select a joining date');
      return false;
    }
    if (!formData.birthday) {
      toast.error('Please select a birthday');
      return false;
    }
    if (!formData.mobile.trim()) {
      toast.error('Please enter a mobile number');
      return false;
    }
    if (!/^\d{10}$/.test(formData.mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!formData.skills.trim()) {
      toast.error('Please enter skills');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const endpoint = currentResource 
        ? `/api/resources/${currentResource.id}`
        : '/api/resources';
      const method = currentResource ? api.put : api.post;
      
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${endpoint}`,
        {
          method: currentResource ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );
      const data = await res.json();
      
      if (res.ok) {
        fetchResources();
        setIsDialogOpen(false);
        toast.success(currentResource ? 'Resource updated successfully' : 'Resource added & User created successfully');
      } else {
        toast.error(data.message || 'Failed to save resource');
      }
    } catch (err) {
      console.error('Failed to save resource');
      toast.error('Failed to save resource');
    }
  };

  const handleDeleteClick = (id) => {
    setResourceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) return;
    
    try {
      await api.delete(`/api/resources/${resourceToDelete}`);
      fetchResources();
      toast.success('Resource deleted successfully');
    } catch (err) {
      console.error('Failed to delete resource');
      toast.error('Failed to delete resource');
    } finally {
      setDeleteConfirmOpen(false);
      setResourceToDelete(null);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [['Name', 'Project', 'Joining Date', 'Birthday', 'Diet', 'Skills', 'Gender', 'Mobile']];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Resource_Upload_Template.xlsx");
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/resources/bulk`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      
      if (res.ok) {
        fetchResources();
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error', err);
      toast.error('Failed to upload file');
    }
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const calculateAge = (birthday) => {
    if (!birthday) return 'N/A';
    const birthDate = new Date(birthday);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const filteredResources = resources.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.skills.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const DietIcon = ({ type }) => {
    if (type === 'Veg') {
      return (
        <div className="flex items-center justify-center h-5 w-5 border-2 border-green-600 p-0.5" title="Veg">
          <div className="h-full w-full rounded-full bg-green-600"></div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-5 w-5 border-2 border-red-600 p-0.5" title="Non-Veg">
        <div className="h-full w-full rounded-full bg-red-600"></div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-bold">Team Resources</CardTitle>
        {isManager && (
          <div className="flex gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".xlsx, .xls"
            />
            <Button variant="outline" size="sm" className="gap-1" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4" /> Template
            </Button>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => fileInputRef.current.click()}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
            <Button onClick={() => handleOpenDialog()} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Add Resource
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or skills..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b">
                <th className="p-4 text-left font-medium">Name</th>
                <th className="p-4 text-left font-medium">Project</th>
                <th className="p-4 text-left font-medium">Skills</th>
                <th className="p-4 text-left font-medium">Diet</th>
                <th className="p-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((resource) => (
                <tr key={resource.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4 align-middle font-medium">{resource.name}</td>
                  <td className="p-4 align-middle">{resource.project}</td>
                  <td className="p-4 align-middle">{resource.skills}</td>
                  <td className="p-4 align-middle">
                    <DietIcon type={resource.diet} />
                  </td>
                  <td className="p-4 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenInfoDialog(resource)}>
                        <Info className="h-4 w-4 text-blue-500" />
                      </Button>
                      {isManager && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(resource)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(resource.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Input id="project" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input id="joiningDate" type="date" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Birthday</Label>
                <Input id="birthday" type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select 
                  id="gender" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.gender} 
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Mobile Number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diet">Diet Preference</Label>
                <select 
                  id="diet" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.diet} 
                  onChange={e => setFormData({...formData, diet: e.target.value})}
                >
                  <option value="Veg">Veg</option>
                  <option value="Non-Veg">Non-Veg</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Input id="skills" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, Node..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Resource</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Info Dialog */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 bg-muted/30">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {currentResource?.name?.charAt(0)}
              </div>
              <div>
                {currentResource?.name}
                <p className="text-xs text-muted-foreground font-normal">{currentResource?.project} Project</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          {currentResource && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Personal Info</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Age:</span> {calculateAge(currentResource.birthday)}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Gender:</span> {currentResource.gender || currentResource.sex || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">DOB:</span> {currentResource.birthday}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Contact & Diet</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Mobile:</span> {currentResource.mobile || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Diet:</span> 
                    <DietIcon type={currentResource.diet} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Professional Details</Label>
                <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Joining Date:</span>
                    <span className="font-medium">{currentResource.joiningDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Skills:</span>
                    <span className="font-medium text-right">{currentResource.skills}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="p-6 pt-0">
            <Button variant="outline" onClick={() => setIsInfoDialogOpen(false)} className="w-full">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this resource. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ResourceList;
